import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-magic-numbers': ['warn', { ignore: [0, 1, -1, 2, 100], ignoreArrayIndexes: true }],
    },
  },
  {
    // Les magic numbers sont *attendus* dans les tests : ce sont les valeurs
    // littérales qu'on assert. Désactiver la règle ici évite 50+ warnings
    // qui n'apportent rien à la qualité.
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      'no-magic-numbers': 'off',
    },
  },
  {
    ignores: ['node_modules', 'dist', 'coverage'],
  }
);
