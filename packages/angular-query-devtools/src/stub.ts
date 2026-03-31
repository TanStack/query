import type { WithDevtools } from './types'
import { makeEnvironmentProviders } from '@angular/core'

// Stub which replaces `withDevtools` in production builds
export const withDevtools: WithDevtools = () => ({
  ɵkind: 'Devtools',
  ɵproviders: makeEnvironmentProviders([]),
})
