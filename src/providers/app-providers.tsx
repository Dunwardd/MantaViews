import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import { GlobalErrorBoundary } from '@/components/ui/global-error-boundary';
import { AuthProvider } from '@/providers/auth-provider';
import { CatalogRealtimeProvider } from '@/providers/catalog-realtime-provider';
import { LocaleProvider } from '@/providers/locale-provider';
import { LocationProvider } from '@/providers/location-provider';
import { queryClient } from '@/services/query/query-client';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <CatalogRealtimeProvider>
        <LocaleProvider>
          <GlobalErrorBoundary>
            <AuthProvider>
              <LocationProvider>{children}</LocationProvider>
            </AuthProvider>
          </GlobalErrorBoundary>
        </LocaleProvider>
      </CatalogRealtimeProvider>
    </QueryClientProvider>
  );
}
