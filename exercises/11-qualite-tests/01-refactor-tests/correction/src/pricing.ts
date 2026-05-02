import { computeSubtotal, countItems } from './cart.js';
import { computeDiscount } from './discount.js';
import { computeShipping } from './shipping.js';
import { computeVat } from './vat.js';
import { formatCents } from './format.js';
import type { OrderInput, OrderResult } from './types.js';

/**
 * Calcule le total d'une commande TTC.
 *
 * Pipeline :
 * 1. sous-total HT depuis le panier
 * 2. remise (code promo + bonus VIP)
 * 3. TVA sur (sous-total - remise)
 * 4. port (gratuit au-dessus du seuil)
 * 5. total = sous-total - remise + TVA + port
 */
export function computeOrderTotal(input: OrderInput): OrderResult {
  const subtotalCents = computeSubtotal(input.items);
  const itemCount = countItems(input.items);
  const discountCents = computeDiscount(subtotalCents, input.code, input.user);
  const taxableAmount = subtotalCents - discountCents;
  const vatCents = computeVat(taxableAmount);
  const shippingCents = computeShipping(subtotalCents);
  const totalCents = taxableAmount + vatCents + shippingCents;

  return {
    itemCount,
    subtotalCents,
    discountCents,
    vatCents,
    shippingCents,
    totalCents,
    display: formatCents(totalCents),
  };
}
