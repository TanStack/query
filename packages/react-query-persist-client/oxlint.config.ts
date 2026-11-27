import pluginReact from '@eslint-react/eslint-plugin'
import { defineConfig } from 'oxlint'
import rootConfig from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig],
  settings: rootConfig.settings,
  plugins: ['react'],
  jsPlugins: ['@eslint-react/eslint-plugin'],
  rules: {
    'react/error-boundaries': 'error',
    'react/exhaustive-deps': 'error',
    'react/globals': 'error',
    'react/immutability': 'error',
    'react/incompatible-library': 'error',
    'react/preserve-manual-memoization': 'error',
    'react/purity': 'error',
    'react/refs': 'error',
    'react/rules-of-hooks': 'error',
    'react/set-state-in-effect': 'error',
    'react/set-state-in-render': 'error',
    'react/static-components': 'error',
    'react/unsupported-syntax': 'error',
    'react/use-memo': 'error',
    ...pluginReact.configs.recommended.rules,
    '@eslint-react/no-context-provider': 'off', // We need to be React 18 compatible
    '@eslint-react/no-use-context': 'off', // We need to be React 18 compatible
    // Covered by Oxlint's native 'react' plugin
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
