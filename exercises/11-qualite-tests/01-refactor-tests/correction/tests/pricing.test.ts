import { describe, it, expect } from 'vitest';
import { computeOrderTotal } from '../src/pricing';

describe('computeOrderTotal', () => {
  it('panier simple sans code ni VIP', () => {
    const result = computeOrderTotal({
      items: [{ price: 1000, qty: 2 }],
    });

    expect(result.itemCount).toBe(2);
    expect(result.subtotalCents).toBe(2000);
    expect(result.discountCents).toBe(0);
    expect(result.vatCents).toBe(400); // 20 % de 2000
    expect(result.shippingCents).toBe(590); // < 50 €
    expect(result.totalCents).toBe(2990); // 2000 + 400 + 590
    expect(result.display).toBe('$29.90');
  });

  it('panier > 50 € → port gratuit', () => {
    const result = computeOrderTotal({
      items: [{ price: 6000, qty: 1 }],
    });
    expect(result.shippingCents).toBe(0);
    expect(result.totalCents).toBe(7200); // 6000 + 1200 TVA
  });

  it('avec code SUMMER10 et VIP', () => {
    const result = computeOrderTotal({
      items: [
        { price: 1000, qty: 2 },
        { price: 2000, qty: 1 },
      ],
      code: 'SUMMER10',
      user: { tier: 'vip' },
    });

    expect(result.subtotalCents).toBe(4000);
    // 10 % + 5 % = 15 % de 4000 = 600
    expect(result.discountCents).toBe(600);
    // TVA sur 4000 - 600 = 3400, soit 680
    expect(result.vatCents).toBe(680);
    // shipping 590 (< 50 € de subtotal)
    expect(result.shippingCents).toBe(590);
    // total = 3400 + 680 + 590 = 4670
    expect(result.totalCents).toBe(4670);
  });

  it('panier vide', () => {
    const result = computeOrderTotal({ items: [] });
    expect(result.subtotalCents).toBe(0);
    expect(result.totalCents).toBe(590); // juste les frais de port
  });

  it('discount plafonné au subtotal', () => {
    // Subtotal 100c < FLAT5 (500c) → la remise se fait capper à 100
    const result = computeOrderTotal({
      items: [{ price: 100, qty: 1 }],
      code: 'FLAT5',
      user: { tier: 'vip' },
    });

    expect(result.subtotalCents).toBe(100);
    expect(result.discountCents).toBe(100); // FLAT5 (500) + VIP (5) capé à 100
    expect(result.vatCents).toBe(0); // 0 après remise
  });
});
