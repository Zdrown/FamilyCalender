'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Photo } from '@/types';
import { useEffect } from 'react';

const FAMILY_ID = process.env.NEXT_PUBLIC_FAMILY_ID || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export function usePhotos(scope?: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['photos', scope],
    queryFn: async () => {
      let q = supabase
        .from('photos')
        .select('*')
        .eq('family_id', FAMILY_ID)
        .order('created_at', { ascending: false });

      if (scope) q = q.eq('scope', scope);

      const { data, error } = await q;
      if (error) throw error;
      return data as Photo[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('photos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['photos'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, queryClient]);

  const uploadPhoto = useMutation({
    mutationFn: async ({ file, caption, uploadedBy, photoScope }: { file: File; caption?: string; uploadedBy?: string; photoScope?: string }) => {
      const fileName = `${FAMILY_ID}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, file);
      if (uploadError) {
        console.error('Photo storage upload failed:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);

      const { data, error } = await supabase
        .from('photos')
        .insert({
          family_id: FAMILY_ID,
          url: publicUrl,
          caption,
          uploaded_by: uploadedBy,
          scope: photoScope || 'family',
        })
        .select()
        .single();
      if (error) {
        console.error('Photo DB insert failed:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos'] }),
  });

  const deletePhoto = useMutation({
    mutationFn: async (id: string) => {
      // Fetch the photo row to get the URL for storage cleanup
      const { data: photo, error: fetchError } = await supabase
        .from('photos')
        .select('url')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      // Extract storage path from URL (everything after "photos/")
      if (photo?.url) {
        const marker = '/storage/v1/object/public/photos/';
        const idx = photo.url.indexOf(marker);
        if (idx !== -1) {
          const storagePath = photo.url.substring(idx + marker.length);
          const { error: storageError } = await supabase.storage.from('photos').remove([storagePath]);
          if (storageError) console.error('Failed to delete photo from storage:', storageError);
        }
      }

      const { error } = await supabase.from('photos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos'] }),
  });

  return { ...query, uploadPhoto, deletePhoto };
}
