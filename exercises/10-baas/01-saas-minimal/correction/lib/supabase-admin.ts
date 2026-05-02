import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase admin (côté serveur uniquement).
 * BYPASS la RLS — à utiliser dans les webhooks et autres endpoints serveur.
 *
 * NE JAMAIS importer ce fichier dans un Client Component.
 *
 * Init paresseux : pendant `next build`, Next collecte les page data en
 * important toutes les routes. Si on instancie au top-level, l'absence de
 * SUPABASE_URL fait planter le build avant même qu'aucune requête n'arrive.
 * Le getter ci-dessous diffère l'init au premier appel (= au runtime).
 */
let cached: SupabaseClient | null = null;

function makeAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var. ' +
      'Configure your .env.local before calling supabaseAdmin.'
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!cached) cached = makeAdminClient();
    return Reflect.get(cached, prop, cached);
  },
});
