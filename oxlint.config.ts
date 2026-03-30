import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['typescript', 'vitest', 'import', 'react'],
  categories: {
    correctness: 'warn',
  },
  env: {
    builtin: true,
    browser: true,
    node: true,
    es2024: true,
  },
  rules: {
    // Suppress tsconfig resolution noise in monorepo
    'typescript/tsconfig-error': 'allow',
  },
  ignorePatterns: [
    '**/dist',
    '**/build',
    '**/node_modules',
    '**/coverage',
    '**/examples',
    '**/integrations',
  ],
  overrides: [
    {
      files: [
        '**/*.ts',
        '**/*.tsx',
        '**/*.js',
        '**/*.jsx',
        '**/*.cjs',
        '**/*.mjs',
      ],
      rules: {
        // ── JavaScript rules (from @tanstack/eslint-config) ──
        'for-direction': 'error',
        'no-async-promise-executor': 'error',
        'no-compare-neg-zero': 'error',
        'no-cond-assign': 'error',
        'no-constant-binary-expression': 'error',
        'no-constant-condition': 'error',
        'no-control-regex': 'error',
        'no-debugger': 'error',
        'no-delete-var': 'error',
        'no-dupe-else-if': 'error',
        'no-duplicate-case': 'error',
        'no-empty-character-class': 'error',
        'no-empty-pattern': 'error',
        'no-empty-static-block': 'error',
        'no-ex-assign': 'error',
        'no-extra-boolean-cast': 'error',
        'no-fallthrough': 'error',
        'no-global-assign': 'error',
        'no-invalid-regexp': 'error',
        'no-irregular-whitespace': 'error',
        'no-loss-of-precision': 'error',
        'no-misleading-character-class': 'error',
        'no-nonoctal-decimal-escape': 'error',
        'no-regex-spaces': 'error',
        'no-self-assign': 'error',
        'no-shadow': 'warn',
        'no-shadow-restricted-names': 'error',
        'no-sparse-arrays': 'error',
        'no-unsafe-finally': 'error',
        'no-unsafe-optional-chaining': 'error',
        'no-unused-labels': 'error',
        'no-unused-private-class-members': 'error',
        'no-useless-backreference': 'error',
        'no-useless-catch': 'error',
        'no-useless-escape': 'error',
        'no-var': 'error',
        'require-yield': 'error',
        'use-isnan': 'error',
        'valid-typeof': 'error',

        // Overridden to 'off' in eslint.config.js
        'no-case-declarations': 'allow',
        'prefer-const': 'allow',

        // ── TypeScript rules (from @tanstack/eslint-config) ──
        // ban-ts-comment: warn because oxlint doesn't support the granular
        // options that allow @ts-expect-error without description — ESLint
        // still enforces the exact policy at error level
        '@typescript-eslint/ban-ts-comment': 'warn',
        '@typescript-eslint/no-duplicate-enum-values': 'error',
        '@typescript-eslint/no-extra-non-null-assertion': 'error',
        // no-inferrable-types: warn because oxlint doesn't support
        // ignoreParameters option — ESLint handles the precise config
        '@typescript-eslint/no-inferrable-types': 'warn',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
        '@typescript-eslint/prefer-as-const': 'error',
        '@typescript-eslint/no-wrapper-object-types': 'error',
        '@typescript-eslint/triple-slash-reference': 'error',

        // Overridden to 'off' in eslint.config.js
        '@typescript-eslint/no-empty-function': 'allow',
        '@typescript-eslint/no-unsafe-function-type': 'allow',
      },
    },
    {
      files: ['**/*.spec.ts*', '**/*.test.ts*', '**/*.test-d.ts*'],
      rules: {
        // ── Vitest rules (from @vitest/eslint-plugin recommended) ──
        // expect-expect & no-standalone-expect: warn because oxlint doesn't
        // support additionalTestBlockFunctions — ESLint handles the full config
        'vitest/expect-expect': 'warn',
        'vitest/no-conditional-expect': 'error',
        'vitest/no-focused-tests': 'error',
        'vitest/no-identical-title': 'error',
        'vitest/no-import-node-test': 'error',
        'vitest/no-standalone-expect': 'warn',
        'vitest/valid-describe-callback': 'error',
        'vitest/valid-expect': 'error',
        'vitest/valid-title': 'error',
        'vitest/no-commented-out-tests': 'error',
        'vitest/no-disabled-tests': 'warn',
      },
    },
  ],
})
