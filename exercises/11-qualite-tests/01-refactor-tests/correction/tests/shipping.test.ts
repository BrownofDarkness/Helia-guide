import { describe, it, expect } from 'vitest';
import { computeShipping } from '../src/shipping';

describe('computeShipping', () => {
  it('panier < 50 € → frais de 5.90 €', () => {
    expect(computeShipping(2000)).toBe(590);
  });

  it('panier exactement 50 € → gratuit', () => {
    expect(computeShipping(5000)).toBe(0);
  });

  it('panier > 50 € → gratuit', () => {
    expect(computeShipping(10000)).toBe(0);
  });
});
