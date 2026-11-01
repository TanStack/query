import type { WithDevtools } from './types'

/**
 * Replaces `withDevtools` in production builds: returns the devtools feature with no providers.
 * @returns A devtools feature that does nothing.
 */
export const withDevtools: WithDevtools = () => ({
  ɵkind: 'Devtools',
  ɵproviders: [],
})
