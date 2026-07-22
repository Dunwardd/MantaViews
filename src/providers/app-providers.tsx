import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import { GlobalErrorBoundary } from '@/components/ui/global-error-boundary';
import { AuthProvider } from '@/providers/auth-provider';
import { LocaleProvider } from '@/providers/locale-provider';
import { queryClient } from '@/services/query/query-client';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <GlobalErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </GlobalErrorBoundary>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
