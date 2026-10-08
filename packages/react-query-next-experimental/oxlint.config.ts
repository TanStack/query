import pluginReact from '@eslint-react/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig } from 'oxlint'
import rootConfig from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig],
  jsPlugins: [
    // 'react-hooks' is reserved for Oxlint's native plugin, which lacks the React Compiler rules
    { name: 'react-hooks-js', specifier: 'eslint-plugin-react-hooks' },
    '@eslint-react/eslint-plugin',
  ],
  rules: {
    ...Object.fromEntries(
      Object.entries(reactHooks.configs.flat.recommended.rules).map(
        ([name, value]) => [
          name.replace(/^react-hooks\//, 'react-hooks-js/'),
          value,
        ],
      ),
    ),
    ...pluginReact.configs.recommended.rules,
    'react-hooks-js/exhaustive-deps': 'error',
    'react-hooks-js/unsupported-syntax': 'error',
    'react-hooks-js/incompatible-library': 'error',
    '@eslint-react/no-context-provider': 'off', // We need to be React 18 compatible
    '@eslint-react/no-use-context': 'off', // We need to be React 18 compatible
    '@eslint-react/dom-no-dangerously-set-innerhtml': 'off',
    // Covered by 'eslint-plugin-react-hooks'
    '@eslint-react/error-boundaries': 'off',
    '@eslint-react/exhaustive-deps': 'off',
    '@eslint-react/globals': 'off',
    '@eslint-react/immutability': 'off',
    '@eslint-react/purity': 'off',
    '@eslint-react/refs': 'off',
    '@eslint-react/rules-of-hooks': 'off',
    '@eslint-react/set-state-in-effect': 'off',
    '@eslint-react/set-state-in-render': 'off',
    '@eslint-react/static-components': 'off',
    '@eslint-react/unsupported-syntax': 'off',
    '@eslint-react/use-memo': 'off',
  },
})
