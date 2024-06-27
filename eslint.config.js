// @ts-check

// @ts-expect-error
import { rootConfig } from '@tanstack/config/eslint'
// @ts-expect-error
import cspellConfigs from '@cspell/eslint-plugin/configs'

export default [
  ...rootConfig,
  cspellConfigs.recommended,
  {
    name: 'tanstack/temp',
    rules: {
      '@cspell/spellchecker': [
        'error',
        {
          cspell: {
            words: [
              'tanstack', // Our package scope
              'tsqd', // Our public interface (TanStack Query Devtools shorthand)
              'retryer', // Our public interface
              'Promisable', // Our public interface
              'extralight', // Our public interface
              'codemod', // We support our codemod
              'typecheck', // Field of vite.config.ts
              'TSES', // @typescript-eslint package's interface
              'tsup', // We use tsup as builder
              'solidjs', // Our target framework
              'tabular-nums', // https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric
              'todos', // Too general word to be caught as error
              'vue-demi', // dependency of @tanstack/vue-query
            ],
          },
        },
      ],
      'no-case-declarations': 'off',
      'no-prototype-builtins': 'off',
    },
  },
]
