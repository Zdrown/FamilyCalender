'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Chore, ChoreCompletion } from '@/types';
import { useEffect } from 'react';
import { format } from 'date-fns';

const FAMILY_ID = process.env.NEXT_PUBLIC_FAMILY_ID || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export function useChores() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['chores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chores')
        .select('*, chore_users(user_id)')
        .eq('family_id', FAMILY_ID)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Chore[];
    },
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  const completionsQuery = useQuery({
    queryKey: ['chore_completions', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chore_completions')
        .select('*')
        .eq('completed_date', today);
      if (error) throw error;
      return data as ChoreCompletion[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('chores-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chores' }, () => {
        queryClient.invalidateQueries({ queryKey: ['chores'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chore_completions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['chore_completions'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, queryClient]);

  const addChore = useMutation({
    mutationFn: async ({ userIds, ...chore }: Partial<Chore> & { userIds?: string[] }) => {
      const { data, error } = await supabase
        .from('chores')
        .insert({ ...chore, family_id: FAMILY_ID })
        .select()
        .single();
      if (error) throw error;
      if (userIds && userIds.length > 0) {
        await supabase.from('chore_users').insert(userIds.map((uid) => ({ chore_id: data.id, user_id: uid })));
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chores'] }),
  });

  const completeChore = useMutation({
    mutationFn: async ({ choreId, userId }: { choreId: string; userId: string }) => {
      const { error } = await supabase.from('chore_completions').insert({
        chore_id: choreId,
        user_id: userId,
        completed_date: today,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chore_completions'] }),
  });

  const uncompleteChore = useMutation({
    mutationFn: async ({ choreId, userId }: { choreId: string; userId: string }) => {
      const { error } = await supabase
        .from('chore_completions')
        .delete()
        .eq('chore_id', choreId)
        .eq('user_id', userId)
        .eq('completed_date', today);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chore_completions'] }),
  });

  const deleteChore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('chores').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chores'] }),
  });

  return {
    ...query,
    completions: completionsQuery.data || [],
    addChore,
    completeChore,
    uncompleteChore,
    deleteChore,
  };
}
