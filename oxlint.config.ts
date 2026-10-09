import { fileURLToPath } from 'node:url'
import pluginVitest from '@vitest/eslint-plugin'
import pluginJsdoc from 'eslint-plugin-jsdoc'
import { defineConfig } from 'oxlint'

/**
 * Oxlint ships a native `jsdoc` plugin that only covers part of
 * 'eslint-plugin-jsdoc', so the original plugin is loaded as a JS plugin
 * under the `jsdoc-js` alias and its recommended rules are renamed to match.
 */
const jsdocRecommendedRules = Object.fromEntries(
  Object.entries(
    pluginJsdoc.configs['flat/recommended-typescript-error'].rules ?? {},
  ).map(([name, value]) => [name.replace(/^jsdoc\//, 'jsdoc-js/'), value]),
)

export default defineConfig({
  $schema: './node_modules/oxlint/configuration_schema.json',
  plugins: ['import', 'typescript', 'unicorn', 'vitest'],
  jsPlugins: [
    { name: 'import-js', specifier: 'eslint-plugin-import-x' },
    { name: 'jsdoc-js', specifier: 'eslint-plugin-jsdoc' },
    // Unlike the native rule, also checks `expectTypeOf` calls
    { name: 'vitest-js', specifier: '@vitest/eslint-plugin' },
    { name: 'cspell', specifier: '@cspell/eslint-plugin' },
    '@stylistic/eslint-plugin',
    // Absolute path so that package configs can extend this config
    fileURLToPath(new URL('./scripts/oxlint/plugin.ts', import.meta.url)),
  ],
  categories: {
    correctness: 'off',
  },
  options: {
    typeAware: true,
  },
  env: {
    browser: true,
    es2020: true,
  },
  settings: {
    vitest: { typecheck: true },
  },
  ignorePatterns: [
    '**/.nx/**',
    '**/.svelte-kit/**',
    '**/build/**',
    '**/coverage/**',
    '**/dist/**',
    '**/snap/**',
    '**/vite.config.*.timestamp-*.*',
  ],
  rules: {
    // JavaScript
    'for-direction': 'error',
    'no-async-promise-executor': 'error',
    'no-class-assign': 'error',
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
    'no-with': 'error',
    'require-yield': 'error',
    'sort-imports': ['error', { ignoreDeclarationSort: true }],
    'use-isnan': 'error',
    'valid-typeof': 'error',

    // Imports
    'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-commonjs': 'error',
    'import/no-duplicates': 'error',
    'import-js/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
          'type',
        ],
      },
    ],

    // TypeScript
    'typescript/array-type': [
      'error',
      { default: 'generic', readonly: 'generic' },
    ],
    'typescript/ban-ts-comment': [
      'error',
      { 'ts-expect-error': false, 'ts-ignore': 'allow-with-description' },
    ],
    'typescript/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    'typescript/method-signature-style': ['error', 'property'],
    'typescript/no-duplicate-enum-values': 'error',
    'typescript/no-extra-non-null-assertion': 'error',
    'typescript/no-for-in-array': 'error',
    'typescript/no-inferrable-types': ['error', { ignoreParameters: true }],
    'typescript/no-misused-new': 'error',
    'typescript/no-namespace': 'error',
    'typescript/no-non-null-asserted-optional-chain': 'error',
    'typescript/no-unnecessary-condition': 'error',
    'typescript/no-unnecessary-type-assertion': 'error',
    'typescript/no-wrapper-object-types': 'error',
    'typescript/prefer-as-const': 'error',
    'typescript/prefer-for-of': 'warn',
    'typescript/require-await': 'warn',
    'typescript/triple-slash-reference': 'error',
    'tanstack-query/type-parameter-naming': 'error',

    // Node
    'unicorn/prefer-node-protocol': 'error',

    // Stylistic
    '@stylistic/spaced-comment': 'error',

    // Spelling
    'cspell/spellchecker': [
      'warn',
      {
        cspell: {
          words: [
            'Promisable', // Our public interface
            'TSES', // @typescript-eslint package's interface
            'codemod', // We support our codemod
            'combinate', // Library name
            'datatag', // Query options tagging
            'extralight', // Our public interface
            'jscodeshift',
            'refetched', // Query refetch operations
            'refetches', // Query refetch operations
            'retryer', // Our public interface
            'solidjs', // Our target framework
            'tabular-nums', // https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric
            'tanstack', // Our package scope
            'todos', // Too general word to be caught as error
            'tsqd', // Our public interface (TanStack Query Devtools shorthand)
            'tsdown', // We use tsdown as builder
            'typecheck', // Field of vite.config.ts
            'vue-demi', // dependency of @tanstack/vue-query
            'ɵkind', // Angular specific
            'ɵproviders', // Angular specific
          ],
        },
      },
    ],

    /**
     * Disallows direct calls to deprecated imperative query methods of `QueryClient`
     * for new tests and code
     *
     * Existing tests that directly test the methods from before the refactoring
     * will be grandfathered in and allowed to continue using the deprecated methods.
     * They should not be removed, but new tests should use the new methods instead.
     */
    'tanstack-query/no-restricted-syntax': [
      'error',
      {
        selector:
          'CallExpression[callee.type="MemberExpression"]:matches([callee.property.name="fetchQuery"], [callee.computed=true][callee.property.value="fetchQuery"])',
        message: 'Use queryClient.query(options) instead.',
      },
      {
        selector:
          'CallExpression[callee.type="MemberExpression"]:matches([callee.property.name="prefetchQuery"], [callee.computed=true][callee.property.value="prefetchQuery"])',
        message:
          'Use queryClient.query(options).catch(noop) instead if errors should be swallowed.',
      },
      {
        selector:
          'CallExpression[callee.type="MemberExpression"]:matches([callee.property.name="ensureQueryData"], [callee.computed=true][callee.property.value="ensureQueryData"])',
        message:
          "Use queryClient.query({ ...options, staleTime: 'static' }) instead.",
      },
      {
        selector:
          'CallExpression[callee.type="MemberExpression"]:matches([callee.property.name="fetchInfiniteQuery"], [callee.computed=true][callee.property.value="fetchInfiniteQuery"])',
        message: 'Use queryClient.infiniteQuery(options) instead.',
      },
      {
        selector:
          'CallExpression[callee.type="MemberExpression"]:matches([callee.property.name="prefetchInfiniteQuery"], [callee.computed=true][callee.property.value="prefetchInfiniteQuery"])',
        message:
          'Use queryClient.infiniteQuery(options).catch(noop) instead if errors should be swallowed.',
      },
      {
        selector:
          'CallExpression[callee.type="MemberExpression"]:matches([callee.property.name="ensureInfiniteQueryData"], [callee.computed=true][callee.property.value="ensureInfiniteQueryData"])',
        message:
          "Use queryClient.infiniteQuery({ ...options, staleTime: 'static' }) instead.",
      },
    ],
  },
  overrides: [
    {
      files: ['**/src/**/*.{ts,tsx}'],
      excludeFiles: [
        '**/__tests__/**',
        '**/__testfixtures__/**',
        '**/*.test.{ts,tsx}',
        '**/*.test-d.{ts,tsx}',
      ],
      rules: {
        ...jsdocRecommendedRules,
        'jsdoc-js/check-tag-names': [
          'error',
          { definedTags: ['defaultValue'] },
        ],
        'jsdoc-js/check-param-names': ['error', { checkDestructured: false }],
        'jsdoc-js/require-jsdoc': [
          'error',
          {
            contexts: [
              'ExportDefaultDeclaration > ArrowFunctionExpression',
              'ExportDefaultDeclaration > ClassDeclaration',
              'ExportDefaultDeclaration > ClassDeclaration > ClassBody > MethodDefinition:not([accessibility="private"]):not([key.type="PrivateIdentifier"]):not([kind="constructor"]):not([override=true])',
              'ExportNamedDeclaration > ClassDeclaration',
              'ExportNamedDeclaration > ClassDeclaration > ClassBody > MethodDefinition:not([accessibility="private"]):not([key.type="PrivateIdentifier"]):not([kind="constructor"]):not([override=true])',
              'ExportNamedDeclaration > TSInterfaceDeclaration',
              'ExportNamedDeclaration > TSInterfaceDeclaration > TSInterfaceBody > TSPropertySignature',
              'ExportNamedDeclaration > TSTypeAliasDeclaration',
              'ExportNamedDeclaration > TSTypeAliasDeclaration > TSTypeLiteral > TSPropertySignature',
              'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression',
            ],
          },
        ],
        'jsdoc-js/require-param': ['error', { checkDestructured: false }],
        'jsdoc-js/check-template-names': 'error',
        'jsdoc-js/informative-docs': 'error',
        'jsdoc-js/match-description': 'error',
        'jsdoc-js/no-bad-blocks': 'error',
        'jsdoc-js/no-blank-block-descriptions': 'error',
        'jsdoc-js/no-blank-blocks': 'error',
        'jsdoc-js/require-asterisk-prefix': 'error',
        'jsdoc-js/require-description': 'error',
        'jsdoc-js/require-hyphen-before-param-description': 'error',
        'jsdoc-js/require-next-description': 'error',
        'jsdoc-js/require-template-description': 'error',
        'jsdoc-js/require-throws': 'error',
        'jsdoc-js/require-throws-description': 'error',
        'jsdoc-js/require-yields-description': 'error',
        'jsdoc-js/sort-tags': 'error',
      },
    },
    {
      files: ['**/*.spec.ts*', '**/*.test.ts*', '**/*.test-d.ts*'],
      rules: {
        ...pluginVitest.configs.recommended.rules,
        'vitest/consistent-test-it': [
          'error',
          { fn: 'it', withinDescribe: 'it' },
        ],
        'vitest/no-standalone-expect': [
          'error',
          { additionalTestBlockFunctions: ['itIf'] },
        ],
        'vitest/valid-expect': 'off',
        'vitest-js/valid-expect': 'error',
      },
    },
  ],
})

/**
 * Native Oxlint equivalent of 'eslint-config-preact', applied on top of the root config.
 *
 * Not ported because Oxlint does not implement them: `no-dupe-args`, `no-undef`,
 * `no-undef-init`, `strict`, `react/jsx-no-bind`, `react/jsx-uses-react`,
 * `react/jsx-uses-vars`, `react/no-deprecated`, `react/prefer-stateless-function`
 * and `react/require-render-return`.
 */
export const preactConfig = defineConfig({
  plugins: ['import', 'typescript', 'unicorn', 'vitest', 'react'],
  settings: {
    react: { version: '16.0' },
  },
  rules: {
    // 'eslint:recommended'
    'constructor-super': 'error',
    'getter-return': 'error',
    'no-case-declarations': 'error',
    'no-const-assign': 'error',
    'no-dupe-class-members': 'error',
    'no-dupe-keys': 'error',
    'no-func-assign': 'error',
    'no-new-native-nonconstructor': 'error',
    'no-obj-calls': 'error',
    'no-prototype-builtins': 'error',
    'no-setter-return': 'error',
    'no-this-before-super': 'error',
    'no-unexpected-multiline': 'error',
    'no-unreachable': 'error',
    'no-unsafe-negation': 'error',

    // Preact / JSX
    'react/display-name': ['warn', { ignoreTranspilerName: false }],
    'react/jsx-key': ['error', { checkFragmentShorthand: true }],
    'react/jsx-no-comment-textnodes': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-target-blank': 'error',
    'react/jsx-no-undef': 'error',
    'react/no-danger': 'warn',
    'react/no-did-mount-set-state': 'error',
    'react/no-did-update-set-state': 'error',
    'react/no-find-dom-node': 'error',
    'react/no-is-mounted': 'error',
    'react/no-string-refs': 'error',
    'react/prefer-es6-class': 'error',
    'react/self-closing-comp': 'error',

    // Hooks
    'react/rules-of-hooks': 'error',
    'react/exhaustive-deps': 'warn',

    // General JavaScript error avoidance
    'no-caller': 'error',
    'no-else-return': 'warn',
    'no-empty-pattern': 'off',
    'no-iterator': 'error',
    'no-lonely-if': 'error',
    'no-multi-str': 'warn',
    'no-new-wrappers': 'error',
    'no-proto': 'error',
    'no-shadow': 'off',
    'no-unneeded-ternary': 'error',
    'no-useless-call': 'warn',
    'no-useless-computed-key': 'warn',
    'no-useless-concat': 'warn',
    'no-useless-constructor': 'warn',
    'no-useless-escape': 'warn',
    'no-useless-rename': 'warn',
    'no-var': 'warn',

    // General JavaScript style
    'object-shorthand': 'warn',
    'prefer-arrow-callback': 'warn',
    'prefer-rest-params': 'warn',
    'prefer-spread': 'warn',
    'prefer-template': 'warn',
    radix: 'warn',
    'unicode-bom': 'error',
  },
})
