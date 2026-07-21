import { AuthError } from '@supabase/supabase-js';

const knownMessages: Record<string, string> = {
  'Email not confirmed': 'Confirma tu correo antes de iniciar sesión.',
  'Invalid login credentials': 'El correo o la contraseña no son correctos.',
  'Password should be at least 6 characters': 'La contraseña es demasiado corta.',
  'Provider is not enabled': 'Google todavía no está habilitado en la configuración de Supabase.',
  'Unsupported provider: provider is not enabled':
    'Google todavía no está habilitado en la configuración de Supabase.',
  'User already registered': 'Ya existe una cuenta con este correo.',
  'User not found': 'No encontramos una cuenta con este correo.',
};

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof AuthError) {
    if (error.status === 429) {
      return 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.';
    }

    return (
      knownMessages[error.message] ?? 'No pudimos completar la autenticación. Inténtalo de nuevo.'
    );
  }

  if (error instanceof Error && error.message === 'OAUTH_CANCELLED') {
    return 'El inicio de sesión con Google fue cancelado.';
  }

  return 'Ocurrió un problema de conexión. Revisa tu internet e inténtalo de nuevo.';
}
