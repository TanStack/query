import { createNoopInjectionToken } from './util/create-injection-token/create-injection-token'
import type { QueryClient } from '@tanstack/query-core'

const tokens = createNoopInjectionToken<QueryClient>('QueryClientToken')

/**
 * Injects the `QueryClient` instance into the component or service.
 *
 * **Example**
 * ```ts
 * const queryClient = injectQueryClient();
 * ```
 * @returns The `QueryClient` instance.
 * @public
 */
export const injectQueryClient = tokens[0]

/**
 * Usually {@link provideAngularQuery} is used once to set up TanStack Query and the
 * {@link https://tanstack.com/query/latest/docs/reference/QueryClient|QueryClient}
 * for the entire application. You can use `provideQueryClient` to provide a
 * different `QueryClient` instance for a part of the application.
 * @public
 */
export const provideQueryClient = tokens[1]

export const QUERY_CLIENT = tokens[2]
