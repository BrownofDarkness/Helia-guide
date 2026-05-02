// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeToggle } from './theme-toggle';
import { ThemeProvider } from './theme-provider';

describe('ThemeToggle', () => {
  it('rend le bouton avec un aria-label', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    expect(screen.getByRole('button', { name: /basculer le thème/i })).toBeDefined();
  });
});
