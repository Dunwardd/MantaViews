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
    const refreshPublicCatalog = () => {
      void queryClient.invalidateQueries({ queryKey: publicCatalogQueryKey });
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
        refreshPublicCatalog,
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          refreshPublicCatalog();
        }
      });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshPublicCatalog();
      }
    });

    return () => {
      appStateSubscription.remove();
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return children;
}
