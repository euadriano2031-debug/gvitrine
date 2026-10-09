// Cliente administrativo do servidor. Nunca importe este módulo no código do navegador.
// Chaves secret/service_role ignoram RLS e só podem ser usadas em operações confiáveis do servidor.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseAdminClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://jxyhzpvgihfkeduvomlu.supabase.co';
  // Prefer the modern secret key. The legacy key is only a temporary compatibility fallback.
  const supabaseAdminKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseAdminKey) {
    throw new Error(
      'Configure SUPABASE_SECRET_KEY nos segredos do servidor para operações administrativas.',
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAdminKey, {
    global: {
      fetch: createSupabaseFetch(supabaseAdminKey),
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

// Use somente em handlers confiáveis do servidor:
// const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
