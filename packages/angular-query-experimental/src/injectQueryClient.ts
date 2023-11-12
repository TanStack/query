import { InjectionToken, inject } from '@angular/core'
import type { Provider } from '@angular/core'
import type { QueryClient } from '@tanstack/query-core'

export const QUERY_CLIENT = new InjectionToken<QueryClient>('QueryClientToken')
export const injectQueryClient = () => inject(QUERY_CLIENT)
export const provideQueryClient = (queryClient: QueryClient): Provider => ({
  provide: QUERY_CLIENT,
  useValue: queryClient,
})
