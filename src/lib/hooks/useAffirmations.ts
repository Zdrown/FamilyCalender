'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Affirmation } from '@/types';
import { useEffect, useMemo } from 'react';

const FAMILY_ID = process.env.NEXT_PUBLIC_FAMILY_ID || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export function useAffirmations(userId?: string | null) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['affirmations', userId],
    queryFn: async () => {
      let q = supabase
        .from('affirmations')
        .select('*')
        .eq('family_id', FAMILY_ID)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

      // If userId provided, get user-specific + family-wide (null user_id)
      if (userId) {
        q = q.or(`user_id.eq.${userId},user_id.is.null`);
      } else {
        q = q.is('user_id', null);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Affirmation[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('affirmations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affirmations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['affirmations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, queryClient]);

  // Daily rotation: pick one based on day of year
  const todaysAffirmation = useMemo(() => {
    const items = query.data || [];
    const pinned = items.find((a) => a.pinned);
    if (pinned) return pinned;
    if (items.length === 0) return null;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return items[dayOfYear % items.length];
  }, [query.data]);

  const addAffirmation = useMutation({
    mutationFn: async (aff: Partial<Affirmation>) => {
      const { data, error } = await supabase
        .from('affirmations')
        .insert({ ...aff, family_id: FAMILY_ID })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['affirmations'] }),
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase.from('affirmations').update({ pinned }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['affirmations'] }),
  });

  const deleteAffirmation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('affirmations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['affirmations'] }),
  });

  return { ...query, todaysAffirmation, addAffirmation, togglePin, deleteAffirmation };
}
