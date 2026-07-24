import { useQueryClient } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect } from 'react';
import { AppState } from 'react-native';

import { getSupabaseClient, isSupabaseConfigured } from '@/services/supabase/client';

const publicCatalogQueryKey = ['public'] as const;

export function CatalogRealtimeProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseClient();
    const refreshCatalogImages = () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: publicCatalogQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['private', 'favorites'] }),
      ]);
    };

    const channel = supabase
      .channel('public-catalog-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'places',
        },
        refreshCatalogImages,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'place_images',
        },
        refreshCatalogImages,
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          refreshCatalogImages();
        }
      });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshCatalogImages();
      }
    });

    return () => {
      appStateSubscription.remove();
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return children;
}
