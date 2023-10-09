import { InjectionToken, makeEnvironmentProviders } from '@angular/core'
import { createQuery } from './createQuery'
import { QUERY_CLIENT } from './queryClient'
import { QueryClientService } from './QueryClientService'
import { createMutation } from './createMutation'
import { createQueries } from './createQueries'
import { useIsFetching } from './useIsFetching'
import { useIsMutating } from './useIsMutating'
import type { EnvironmentProviders } from '@angular/core'
import type { QueryClient } from '@tanstack/query-core'

export const CreateQuery = new InjectionToken<typeof createQuery>('CreateQuery')
export const CreateMutation = new InjectionToken<typeof createMutation>(
  'CreateMutation',
)
export const CreateQueries = new InjectionToken<typeof createQueries>(
  'CreateQueries',
)
export const UseQueryClient = new InjectionToken<QueryClient>('UseQueryClient')
export const UseIsFetching = new InjectionToken<typeof useIsFetching>(
  'UseIsFetching',
)
export const UseIsMutating = new InjectionToken<typeof useIsMutating>(
  'UseIsMutating',
)

/**
 * Sets up providers necessary to enable Angular Query functionality for the application.
 * Allows to configure the query client.
 *
 * @usageNotes
 *
 * Basic example of how you can provide the query client to your application:
 * ```
 * bootstrapApplication(AppComponent, {
 *   providers: [provideAngularQuery(new QueryClient())]
 * });
 * ```
 *
 * You can also configure the query client by passing the optional configuration object to its constructor:
 * ```
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideAngularQuery(
 *       new QueryClient({
 *         // config options
 *       }),
 *     ),
 *   ],
 * })
 * ```
 *
 *
 * @publicApi
 * @param queryClient The `QueryClient` to provide.
 * @returns A set of providers to set up Angular Query.
 */
export function provideAngularQuery(
  queryClient: QueryClient,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: QUERY_CLIENT, useValue: queryClient },
    { provide: CreateQuery, useValue: createQuery },
    { provide: CreateMutation, useValue: createMutation },
    { provide: CreateQueries, useValue: createQueries },
    {
      provide: QueryClientService,
      useClass: QueryClientService,
      deps: [QUERY_CLIENT],
    },
    {
      // Named this UseQueryClient as UseQuery would conflict with the type name
      // also, it is consistent with React Query's useQueryClient hook
      provide: UseQueryClient,
      useExisting: QUERY_CLIENT,
    },
    {
      provide: UseIsFetching,
      useValue: useIsFetching,
    },
    {
      provide: UseIsMutating,
      useValue: useIsMutating,
    },
  ])
}
