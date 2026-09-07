import js from '@eslint/js';
import globals from 'globals';
import next from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';

// next/core-web-vitals ya trae react, react-hooks y el parser de TypeScript.
export default tseslint.config(
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'tsconfig.tsbuildinfo'],
  },
  ...next,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Los casos que quedan son carga asincrona, marcas de hidratacion y
      // sincronizacion con props. Se avisa pero no bloquea la build.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: ['tests/**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
  },
);
