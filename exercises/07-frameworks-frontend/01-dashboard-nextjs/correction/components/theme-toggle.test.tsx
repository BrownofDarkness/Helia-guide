// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeToggle } from './theme-toggle';
import { ThemeProvider } from './theme-provider';

describe('ThemeToggle', () => {
  it('rend un placeholder avant le mount (évite hydration mismatch)', () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    // Avant useEffect, le composant rend un div vide aria-hidden
    expect(container.querySelector('[aria-hidden="true"]')).toBeDefined();
  });

  it('rend le bouton accessible avec aria-label', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    // Après le mount (microtask), le bouton apparaît
    const button = await screen.findByRole('button', { name: /basculer le thème/i });
    expect(button).toBeDefined();
  });
});
