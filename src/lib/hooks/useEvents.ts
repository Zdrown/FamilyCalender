'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { CalendarEvent } from '@/types';
import { useEffect } from 'react';
import { format } from 'date-fns';

const FAMILY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export function useEvents(startDate?: Date, endDate?: Date) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const start = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
  const end = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;

  const query = useQuery({
    queryKey: ['events', start, end],
    queryFn: async () => {
      let q = supabase
        .from('events')
        .select('*, event_users(user_id)')
        .eq('family_id', FAMILY_ID)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (start) q = q.gte('date', start);
      if (end) q = q.lte('date', end);

      const { data, error } = await q;
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, queryClient]);

  const addEvent = useMutation({
    mutationFn: async ({ userIds, ...event }: Partial<CalendarEvent> & { userIds: string[] }) => {
      const { data, error } = await supabase
        .from('events')
        .insert({ ...event, family_id: FAMILY_ID })
        .select()
        .single();
      if (error) throw error;

      if (userIds.length > 0) {
        const { error: linkError } = await supabase
          .from('event_users')
          .insert(userIds.map((uid) => ({ event_id: data.id, user_id: uid })));
        if (linkError) throw linkError;
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, userIds, ...updates }: Partial<CalendarEvent> & { id: string; userIds?: string[] }) => {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      if (userIds) {
        await supabase.from('event_users').delete().eq('event_id', id);
        if (userIds.length > 0) {
          await supabase
            .from('event_users')
            .insert(userIds.map((uid) => ({ event_id: id, user_id: uid })));
        }
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  return { ...query, addEvent, updateEvent, deleteEvent };
}
