'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';
import { useEffect } from 'react';

const FAMILY_ID = process.env.NEXT_PUBLIC_FAMILY_ID || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export function useUsers() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('family_id', FAMILY_ID)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as User[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, queryClient]);

  const addUser = useMutation({
    mutationFn: async (user: Partial<User>) => {
      const { data, error } = await supabase
        .from('users')
        .insert({ ...user, family_id: FAMILY_ID })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<User> & { id: string }) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return { ...query, addUser, updateUser, deleteUser };
}
