import { VIP_DISCOUNT_RATE } from './constants.js';
import type { User } from './types.js';

interface PercentRule {
  type: 'percent';
  rate: number;
}

interface FlatRule {
  type: 'flat';
  amountCents: number;
}

type DiscountRule = PercentRule | FlatRule;

/**
 * Catalogue des codes promo. En prod : table DB avec validity_from/until.
 */
const PROMO_CODES: Record<string, DiscountRule> = {
  SUMMER10: { type: 'percent', rate: 0.1 },
  WELCOME20: { type: 'percent', rate: 0.2 },
  VIP50: { type: 'percent', rate: 0.5 },
  FLAT5: { type: 'flat', amountCents: 500 },
};

function applyRule(rule: DiscountRule, subtotalCents: number): number {
  switch (rule.type) {
    case 'percent':
      return Math.round(subtotalCents * rule.rate);
    case 'flat':
      return rule.amountCents;
  }
}

/**
 * Calcule la remise totale (code promo + bonus VIP éventuel).
 * La remise est plafonnée au sous-total (jamais négative).
 */
export function computeDiscount(
  subtotalCents: number,
  code: string | undefined,
  user: User | undefined
): number {
  let discount = 0;

  if (code !== undefined) {
    const rule = PROMO_CODES[code];
    if (rule) {
      discount += applyRule(rule, subtotalCents);
    }
  }

  if (user?.tier === 'vip') {
    discount += Math.round(subtotalCents * VIP_DISCOUNT_RATE);
  }

  return Math.min(discount, subtotalCents);
}
