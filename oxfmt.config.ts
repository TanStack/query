import { defineConfig } from 'oxfmt'

export default defineConfig({
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 80,
  sortPackageJson: false,
  svelte: {},
  ignorePatterns: [
    '**/.next',
    '**/.nx/cache',
    '**/.svelte-kit',
    '**/build',
    '**/coverage',
    '**/dist',
    '**/query-codemods/**/__testfixtures__',
    '.changeset/*.md',
    'pnpm-lock.yaml',
    '**/tsconfig.vitest-temp.json',
    'docs/framework/*/reference',
  ],
})
