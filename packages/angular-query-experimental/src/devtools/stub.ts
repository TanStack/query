import type { WithDevtools } from './types'

// Stub which replaces `withDevtools` in production builds
export const withDevtools: WithDevtools = () => ({
  ɵkind: 'Devtools',
  ɵproviders: [],
})
