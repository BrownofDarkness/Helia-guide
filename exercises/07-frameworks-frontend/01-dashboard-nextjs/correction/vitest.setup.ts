/**
 * Polyfills jsdom pour les APIs que next-themes / Tailwind utilisent au runtime.
 * jsdom n'implémente ni matchMedia ni IntersectionObserver — on les mocke
 * proprement ici pour que les composants Client se montent sans crash.
 */
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),    // deprecated mais certaines libs y appellent
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
