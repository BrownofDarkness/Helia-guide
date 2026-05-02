import { VAT_RATE } from './constants.js';

/**
 * Calcule la TVA sur un montant HT en centimes.
 * Arrondi à l'entier inférieur (les centimes décimaux n'existent pas).
 */
export function computeVat(amountCentsExclVat: number): number {
  return Math.round(amountCentsExclVat * VAT_RATE);
}
