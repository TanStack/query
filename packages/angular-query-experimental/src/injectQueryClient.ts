import { createNoopInjectionToken } from 'ngxtension/create-injection-token'
import type { QueryClient } from '@tanstack/query-core'

const [injectQueryClient, provideQueryClient, QUERY_CLIENT] =
  createNoopInjectionToken<QueryClient>('QueryClientToken')

export { injectQueryClient, provideQueryClient, QUERY_CLIENT }
