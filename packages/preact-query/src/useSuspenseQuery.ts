import { QueryObserver, skipToken } from '@tanstack/query-core'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'

import { defaultThrowOnError } from './suspense'
import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from './types'
import { useBaseQuery } from './useBaseQuery'

/**
 * The options for `useSuspenseQuery` are the same as for `useQuery`, except for `throwOnError`, `enabled`, and
 * `placeholderData`.
 *
 * @param options - The {@link UseSuspenseQueryOptions} to use — the same options as `useQuery`, minus the ones listed above.
 * @param queryClient - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
 * be used.
 * @returns The same object as `useQuery`, except that `data` is guaranteed to be defined, `isPlaceholderData`
 * is missing, and `status` is either `success` or `error` (with the derived flags set accordingly).
 *
 * Caveat: cancellation does not work.
 *
 * @example
 * ```tsx
 * import { Suspense } from 'preact/compat'
 * import { useSuspenseQuery } from '@tanstack/preact-query'
 *
 * function Posts() {
 *   // `data` is guaranteed to be defined here — no `isPending` check needed.
 *   const { data, isFetching } = useSuspenseQuery({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *   })
 *
 *   return (
 *     <div>
 *       <h1>Posts {isFetching ? <Spinner /> : null}</h1>
 *       {data.map((post) => (
 *         <p key={post.id}>{post.title}</p>
 *       ))}
 *     </div>
 *   )
 * }
 *
 * function App() {
 *   return (
 *     <Suspense fallback={<h1>Loading posts...</h1>}>
 *       <Posts />
 *     </Suspense>
 *   )
 * }
 * ```
 */
export function useSuspenseQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseSuspenseQueryResult<TData, TError> {
  if (process.env.NODE_ENV !== 'production') {
    if ((options.queryFn as any) === skipToken) {
      console.error('skipToken is not allowed for useSuspenseQuery')
    }
  }

  return useBaseQuery(
    {
      ...options,
      enabled: true,
      suspense: true,
      throwOnError: defaultThrowOnError,
      placeholderData: undefined,
    },
    QueryObserver,
    queryClient,
  ) as UseSuspenseQueryResult<TData, TError>
}
