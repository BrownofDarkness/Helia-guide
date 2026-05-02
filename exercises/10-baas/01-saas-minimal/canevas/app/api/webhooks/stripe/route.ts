import { NextResponse } from 'next/server';
// import { headers } from 'next/headers';
// import type Stripe from 'stripe';
// import { stripe } from '@/lib/stripe';
// import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/webhooks/stripe
 *
 * Reçoit les webhooks Stripe (mode test → en prod, configurer l'endpoint
 * dans le dashboard Stripe avec les events `checkout.session.completed`,
 * `customer.subscription.updated`, `customer.subscription.deleted`).
 *
 * ÉTAPES (dans cet ordre, chacune compte) :
 *
 * 1. Lire le body **brut** avec `await request.text()` (PAS `.json()` — la
 *    signature est calculée sur les bytes exacts envoyés par Stripe ; un
 *    re-parse JSON change l'ordre des clés et casse le HMAC).
 *
 * 2. Récupérer l'en-tête `stripe-signature` via `headers()`.
 *
 * 3. Vérifier la signature avec `stripe.webhooks.constructEvent(body, sig, secret)`.
 *    Si ça throw → renvoyer 400 (ne JAMAIS leak le détail de l'erreur, ça donne
 *    des indices à un attaquant).
 *
 * 4. Switch sur `event.type` :
 *    - `checkout.session.completed` → marquer la subscription `active`.
 *      L'`event.data.object` est une `Checkout.Session` ; récupère le
 *      `userId` depuis `session.metadata.clerk_user_id`.
 *    - `customer.subscription.updated` / `customer.subscription.deleted`
 *      → mapper le `sub.status` Stripe vers notre enum `'active' | 'cancelled' | 'free'`.
 *
 * 5. Renvoyer `{ received: true }` à Stripe (200), sinon il retry.
 *
 * Cf. README.md § 3 (webhooks signés et idempotents).
 */
export async function POST(request: Request) {
  // TODO 1 : body brut
  // TODO 2 : header signature
  // TODO 3 : constructEvent (try/catch → 400 si invalide)
  // TODO 4 : switch sur event.type, update Supabase via supabaseAdmin
  // TODO 5 : return NextResponse.json({ received: true })
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
