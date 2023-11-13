import type { QueryClient } from '@tanstack/query-core'
import { createNoopInjectionToken } from 'ngxtension/create-injection-token'

const [injectQueryClient, provideQueryClient, QUERY_CLIENT] =
  createNoopInjectionToken<QueryClient>('QueryClientToken')

export { injectQueryClient, provideQueryClient, QUERY_CLIENT }

