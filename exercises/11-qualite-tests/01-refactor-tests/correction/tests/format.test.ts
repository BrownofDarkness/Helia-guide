import { describe, it, expect } from 'vitest';
import { formatCents } from '../src/format';

describe('formatCents', () => {
  it('1000 cents → $10.00', () => {
    expect(formatCents(1000)).toBe('$10.00');
  });

  it('1234 cents → $12.34', () => {
    expect(formatCents(1234)).toBe('$12.34');
  });

  it('0 cents → $0.00', () => {
    expect(formatCents(0)).toBe('$0.00');
  });
});
