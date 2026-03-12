'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Todo } from '@/types';
import { useEffect } from 'react';

const FAMILY_ID = process.env.NEXT_PUBLIC_FAMILY_ID || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export function useTodos() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('todos')
        .select('*, todo_users(user_id)')
        .eq('family_id', FAMILY_ID)
        .order('completed', { ascending: true })
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Todo[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('todos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, queryClient]);

  const addTodo = useMutation({
    mutationFn: async ({ userIds, ...todo }: Partial<Todo> & { userIds?: string[] }) => {
      const { data, error } = await supabase
        .from('todos')
        .insert({ ...todo, family_id: FAMILY_ID })
        .select()
        .single();
      if (error) throw error;
      if (userIds && userIds.length > 0) {
        await supabase.from('todo_users').insert(userIds.map((uid) => ({ todo_id: data.id, user_id: uid })));
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const updateTodo = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Todo> & { id: string }) => {
      const { data, error } = await supabase.from('todos').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const toggleTodo = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from('todos').update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  return { ...query, addTodo, updateTodo, deleteTodo, toggleTodo };
}
