'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { MustHave, MustHaveCompletion } from '@/types';
import { useEffect } from 'react';
import { format, startOfWeek, startOfMonth } from 'date-fns';

export function useMustHaves(userId: string | null) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const query = useQuery({
    queryKey: ['must_haves', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('must_haves')
        .select('*')
        .eq('user_id', userId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as MustHave[];
    },
  });

  const completionsQuery = useQuery({
    queryKey: ['must_have_completions', userId, today],
    enabled: !!userId,
    queryFn: async () => {
      // Fetch completions for today, this week start, and this month start
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const dates = [today, weekStart, monthStart];

      const { data, error } = await supabase
        .from('must_have_completions')
        .select('*')
        .in('completed_date', dates);
      if (error) throw error;
      return data as MustHaveCompletion[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('must-haves-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'must_haves' }, () => {
        queryClient.invalidateQueries({ queryKey: ['must_haves'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'must_have_completions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['must_have_completions'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, queryClient]);

  const addMustHave = useMutation({
    mutationFn: async (item: Partial<MustHave>) => {
      const { data, error } = await supabase.from('must_haves').insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['must_haves'] }),
  });

  const toggleCompletion = useMutation({
    mutationFn: async ({ mustHaveId, cadence, isCompleted }: { mustHaveId: string; cadence: string; isCompleted: boolean }) => {
      const completionDate = cadence === 'daily' ? today
        : cadence === 'weekly' ? format(startOfWeek(new Date()), 'yyyy-MM-dd')
        : format(startOfMonth(new Date()), 'yyyy-MM-dd');

      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from('must_have_completions')
          .delete()
          .eq('must_have_id', mustHaveId)
          .eq('completed_date', completionDate);
        if (error) throw error;
      } else {
        // Add completion
        const { error } = await supabase
          .from('must_have_completions')
          .insert({ must_have_id: mustHaveId, completed_date: completionDate });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['must_have_completions'] }),
  });

  const deleteMustHave = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('must_haves').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['must_haves'] }),
  });

  return {
    items: query.data || [],
    completions: completionsQuery.data || [],
    isLoading: query.isLoading,
    addMustHave,
    toggleCompletion,
    deleteMustHave,
  };
}
