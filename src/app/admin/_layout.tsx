import { useQuery } from '@tanstack/react-query';
import { Redirect, Slot } from 'expo-router';

import { LoadingState } from '@/components/ui/feedback-state';
import { useAuth } from '@/providers/auth-provider';
import { getCurrentUserIsAdmin } from '@/services/profiles/profile-service';

export default function AdminLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const adminQuery = useQuery({
    enabled: Boolean(user?.id),
    queryFn: getCurrentUserIsAdmin,
    queryKey: ['private', 'is-admin', user?.id],
  });

  if (isLoading || (isAuthenticated && adminQuery.isPending)) {
    return <LoadingState label="Verificando acceso administrativo…" />;
  }
  if (!isAuthenticated) {
    return <Redirect href={{ pathname: '/sign-in', params: { next: '/admin' } }} />;
  }
  if (!adminQuery.data) return <Redirect href="/(tabs)/profile" />;
  return <Slot />;
}
