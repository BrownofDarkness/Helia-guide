import { FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_FEE_CENTS } from './constants.js';

/**
 * Calcule les frais de port. Gratuit au-dessus du seuil.
 */
export function computeShipping(subtotalCents: number): number {
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FEE_CENTS;
}
