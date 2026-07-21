import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from '@/providers/auth-provider';

export function useAuthGuard() {
  const { isAuthenticated } = useAuth();

  return useCallback(
    (action: () => void, returnTo: Href = '/(tabs)') => {
      if (isAuthenticated) {
        action();
        return true;
      }

      router.push({ pathname: '/sign-in', params: { next: String(returnTo) } });
      return false;
    },
    [isAuthenticated],
  );
}
