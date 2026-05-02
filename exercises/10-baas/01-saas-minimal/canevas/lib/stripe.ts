import Stripe from 'stripe';

/**
 * Client Stripe paresseux : on ne crée l'instance qu'au premier appel.
 *
 * La version d'API Stripe est figée explicitement : ça empêche un upgrade
 * automatique du SDK de casser silencieusement les charges (un nouveau champ
 * requis, un format de réponse modifié). On la met à jour à la main quand on
 * teste une nouvelle version dans Stripe Workbench.
 */
let cached: Stripe | null = null;

function makeStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is required. Configure your .env.local before calling stripe.'
    );
  }
  return new Stripe(key, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  });
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!cached) cached = makeStripeClient();
    return Reflect.get(cached, prop, cached);
  },
});
