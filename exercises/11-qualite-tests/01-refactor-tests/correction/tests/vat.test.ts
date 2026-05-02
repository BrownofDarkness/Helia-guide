import { describe, it, expect } from 'vitest';
import { computeVat } from '../src/vat';

describe('computeVat', () => {
  it('20 % de 1000 = 200', () => {
    expect(computeVat(1000)).toBe(200);
  });

  it('20 % de 0 = 0', () => {
    expect(computeVat(0)).toBe(0);
  });

  it('arrondit correctement', () => {
    expect(computeVat(1235)).toBe(247); // 1235 * 0.2 = 247
  });
});
