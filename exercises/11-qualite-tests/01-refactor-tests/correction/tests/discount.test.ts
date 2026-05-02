import { describe, it, expect } from 'vitest';
import { computeDiscount } from '../src/discount';

describe('computeDiscount', () => {
  it('aucun code, aucun user → 0', () => {
    expect(computeDiscount(10000, undefined, undefined)).toBe(0);
  });

  it('code SUMMER10 → 10 %', () => {
    expect(computeDiscount(10000, 'SUMMER10', undefined)).toBe(1000);
  });

  it('code WELCOME20 → 20 %', () => {
    expect(computeDiscount(10000, 'WELCOME20', undefined)).toBe(2000);
  });

  it('code VIP50 → 50 %', () => {
    expect(computeDiscount(10000, 'VIP50', undefined)).toBe(5000);
  });

  it('code FLAT5 → 500 cents fixe', () => {
    expect(computeDiscount(10000, 'FLAT5', undefined)).toBe(500);
  });

  it('code inconnu → 0', () => {
    expect(computeDiscount(10000, 'NOPE', undefined)).toBe(0);
  });

  it('user VIP → +5 %', () => {
    expect(computeDiscount(10000, undefined, { tier: 'vip' })).toBe(500);
  });

  it('user standard → pas de bonus', () => {
    expect(computeDiscount(10000, undefined, { tier: 'standard' })).toBe(0);
  });

  it('combine code + VIP', () => {
    // 10 % + 5 % = 15 % de 10000 = 1500
    expect(computeDiscount(10000, 'SUMMER10', { tier: 'vip' })).toBe(1500);
  });

  it('plafonne au sous-total (impossible de devoir négatif)', () => {
    // FLAT5 = 500 cents fixe, subtotal = 100 cents → cap au subtotal
    expect(computeDiscount(100, 'FLAT5', undefined)).toBe(100);
    // FLAT5 (500) + VIP (5 % de 100 = 5) = 505 → cap au subtotal (100)
    expect(computeDiscount(100, 'FLAT5', { tier: 'vip' })).toBe(100);
  });
});
