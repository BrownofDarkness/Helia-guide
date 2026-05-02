import type { CartItem } from './types.js';

/**
 * Calcule le sous-total d'un panier (en centimes).
 * Ignore les lignes invalides (qty < 1, price < 0 traité comme 0).
 */
export function computeSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    if (item.qty < 1) return sum;
    const safePrice = Math.max(0, item.price);
    return sum + safePrice * item.qty;
  }, 0);
}

/**
 * Compte le nombre total d'articles (somme des quantités valides).
 */
export function countItems(items: CartItem[]): number {
  return items.reduce((sum, item) => (item.qty < 1 ? sum : sum + item.qty), 0);
}
