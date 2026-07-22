import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

import { ApiError } from './http.ts';

type AuthContext = {
  client: SupabaseClient;
  user: User;
};

function readNamedKeys(variableName: string) {
  const raw = Deno.env.get(variableName);
  if (!raw) return {} as Record<string, string>;

  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    throw new ApiError(
      500,
      'SERVER_CONFIGURATION_ERROR',
      `${variableName} no contiene JSON válido.`,
    );
  }
}

export function getPublishableKey() {
  const key =
    readNamedKeys('SUPABASE_PUBLISHABLE_KEYS').default ?? Deno.env.get('SUPABASE_ANON_KEY');
  if (!key) throw new ApiError(500, 'SERVER_CONFIGURATION_ERROR', 'Falta la publishable key.');
  return key;
}

export function getSecretKey() {
  const key =
    readNamedKeys('SUPABASE_SECRET_KEYS').default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) throw new ApiError(500, 'SERVER_CONFIGURATION_ERROR', 'Falta la secret key.');
  return key;
}

function getSupabaseUrl() {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) throw new ApiError(500, 'SERVER_CONFIGURATION_ERROR', 'Falta SUPABASE_URL.');
  return url;
}

export function requirePublishableKey(request: Request) {
  const receivedKey = request.headers.get('apikey');
  const acceptedKeys = Object.values(readNamedKeys('SUPABASE_PUBLISHABLE_KEYS'));
  const legacyKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (legacyKey) acceptedKeys.push(legacyKey);

  if (!receivedKey || !acceptedKeys.includes(receivedKey)) {
    throw new ApiError(401, 'INVALID_API_KEY', 'La API key no es válida.');
  }
}

export async function requireUser(request: Request): Promise<AuthContext> {
  requirePublishableKey(request);

  const authorization = request.headers.get('Authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) throw new ApiError(401, 'AUTH_REQUIRED', 'Debes iniciar sesión.');

  const client = createClient(getSupabaseUrl(), getPublishableKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data, error } = await client.auth.getUser(accessToken);

  if (error || !data.user) throw new ApiError(401, 'INVALID_SESSION', 'La sesión no es válida.');
  return { client, user: data.user };
}

export async function requireAdmin(request: Request): Promise<AuthContext> {
  const context = await requireUser(request);
  const { data, error } = await context.client
    .from('user_roles')
    .select('role')
    .eq('user_id', context.user.id)
    .single();

  if (error || data?.role !== 'admin') {
    throw new ApiError(403, 'ADMIN_REQUIRED', 'Esta operación requiere rol de administrador.');
  }

  return context;
}

export function createAdminClient() {
  return createClient(getSupabaseUrl(), getSecretKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
