'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { GroceryItem } from '@/types';
import { useEffect } from 'react';

const FAMILY_ID = process.env.NEXT_PUBLIC_FAMILY_ID || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export function useGrocery() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['grocery'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('family_id', FAMILY_ID)
        .order('checked', { ascending: true })
        .order('category', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as GroceryItem[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('grocery-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['grocery'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, queryClient]);

  const addItem = useMutation({
    mutationFn: async (item: Partial<GroceryItem>) => {
      const { data, error } = await supabase
        .from('grocery_items')
        .insert({ ...item, family_id: FAMILY_ID })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['grocery'] }),
  });

  const toggleItem = useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const { error } = await supabase.from('grocery_items').update({ checked }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['grocery'] }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; item?: string; quantity?: string | null; category?: GroceryItem['category'] }) => {
      const { error } = await supabase.from('grocery_items').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['grocery'] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('grocery_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['grocery'] }),
  });

  const clearChecked = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .eq('family_id', FAMILY_ID)
        .eq('checked', true);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['grocery'] }),
  });

  return { ...query, addItem, toggleItem, updateItem, deleteItem, clearChecked };
}
