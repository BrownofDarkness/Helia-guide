export { computeOrderTotal } from './pricing.js';
export type { CartItem, User, OrderInput, OrderResult, UserTier } from './types.js';

// Démo si exécuté directement
import { computeOrderTotal } from './pricing.js';

const result = computeOrderTotal({
  items: [
    { price: 1000, qty: 2 },
    { price: 2000, qty: 1 },
  ],
  code: 'SUMMER10',
  user: { tier: 'vip' },
});

console.warn(JSON.stringify(result, null, 2));
