import { NextResponse } from 'next/server';
// import { auth, currentUser } from '@clerk/nextjs/server';
// import { stripe } from '@/lib/stripe';
// import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/checkout
 *
 * Crée une session Stripe Checkout pour l'utilisateur connecté et renvoie
 * `{ url }` que le front utilise pour rediriger.
 *
 * Étapes :
 * 1. Vérifier l'auth via Clerk (`auth()` retourne `{ userId }` ou `null`).
 *    Si pas connecté → 401.
 * 2. Récupérer ou créer le customer Stripe :
 *    - Lire `subscriptions.stripe_customer_id` pour cet `user_id` dans Supabase.
 *    - S'il n'existe pas, créer un Stripe Customer + l'upsert dans Supabase.
 * 3. Créer la session Checkout en mode `subscription` avec le price ID
 *    `process.env.NEXT_PUBLIC_STRIPE_PRICE_ID`.
 * 4. Retourner `{ url: session.url }` (le front fait `window.location.href`).
 *
 * Cf. lib/stripe.ts (déjà fourni) et lib/supabase-admin.ts.
 */
export async function POST() {
  // TODO 1 : auth Clerk
  // TODO 2 : récupérer ou créer le customer Stripe (via Supabase)
  // TODO 3 : stripe.checkout.sessions.create
  // TODO 4 : return NextResponse.json({ url: session.url })
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
