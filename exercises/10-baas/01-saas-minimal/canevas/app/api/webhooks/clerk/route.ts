import { NextResponse } from 'next/server';
// import { headers } from 'next/headers';
// import { Webhook } from 'svix';
// import { sendWelcomeEmail } from '@/lib/resend';
// import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/webhooks/clerk
 *
 * Reçoit les webhooks Clerk (configure l'endpoint dans le dashboard Clerk avec
 * l'event `user.created`).
 *
 * ÉTAPES :
 *
 * 1. Lire les 3 headers svix : `svix-id`, `svix-timestamp`, `svix-signature`.
 *    Si l'un manque → 400.
 *
 * 2. Lire le body brut (`await request.text()`).
 *
 * 3. Vérifier la signature avec :
 *    `new Webhook(process.env.CLERK_WEBHOOK_SECRET!).verify(body, { 'svix-id', 'svix-timestamp', 'svix-signature' })`
 *    En cas d'échec → 400 (sans détail).
 *
 * 4. Si `event.type === 'user.created'` :
 *    - Initialiser `subscriptions` en `status: 'free'` via `supabaseAdmin.upsert`
 *      (l'upsert garantit l'idempotence si l'event est rejoué).
 *    - Envoyer l'email de bienvenue avec `sendWelcomeEmail(email, firstName)`.
 *
 * 5. Renvoyer `{ received: true }` (200).
 *
 * Cf. README.md § 3.3 (svix Clerk) et lib/resend.ts (sendWelcomeEmail fourni).
 */
export async function POST(_request: Request) {
  // TODO 1 : lire les 3 headers svix-*
  // TODO 2 : body brut
  // TODO 3 : verify via svix Webhook
  // TODO 4 : si user.created → upsert subscriptions + sendWelcomeEmail
  // TODO 5 : return { received: true }
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
