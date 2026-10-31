import { vi } from 'vitest'

// `oxc-parser` is an optional peer dependency. Without it, imported files are parsed with the parser
// of the file being linted, so every test runs again that way.
vi.mock(import('../utils/prefetch-analysis/oxc'), () => ({
  canParseWithOxc: () => false,
  parseWithOxc: () => null,
}))

await import('./require-prefetch.test')
await import('./require-prefetch-linted-files.test')
await import('./require-prefetch-next.test')
await import('./require-prefetch-react-router.test')
await import('./require-prefetch-waku.test')
