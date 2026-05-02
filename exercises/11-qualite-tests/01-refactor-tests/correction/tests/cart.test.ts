import { describe, it, expect } from 'vitest';
import { computeSubtotal, countItems } from '../src/cart';

describe('computeSubtotal', () => {
  it('panier vide → 0', () => {
    expect(computeSubtotal([])).toBe(0);
  });

  it('1 item simple', () => {
    expect(computeSubtotal([{ price: 1000, qty: 2 }])).toBe(2000);
  });

  it('plusieurs items', () => {
    expect(
      computeSubtotal([
        { price: 1000, qty: 2 },
        { price: 500, qty: 3 },
      ])
    ).toBe(3500);
  });

  it('ignore les lignes avec qty < 1', () => {
    expect(
      computeSubtotal([
        { price: 1000, qty: 0 },
        { price: 1000, qty: -1 },
        { price: 1000, qty: 1 },
      ])
    ).toBe(1000);
  });

  it('traite les prix négatifs comme 0', () => {
    expect(computeSubtotal([{ price: -100, qty: 5 }])).toBe(0);
  });
});

describe('countItems', () => {
  it('compte les quantités valides', () => {
    expect(
      countItems([
        { price: 100, qty: 2 },
        { price: 100, qty: 3 },
      ])
    ).toBe(5);
  });

  it('ignore les qty invalides', () => {
    expect(
      countItems([
        { price: 100, qty: 2 },
        { price: 100, qty: 0 },
      ])
    ).toBe(2);
  });
});
