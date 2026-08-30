import { QueryObserver, skipToken } from '@tanstack/query-core'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'

import { defaultThrowOnError } from './suspense'
import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from './types'
import { useBaseQuery } from './useBaseQuery'

/**
 * The options for `useSuspenseQuery` are the same as for `useQuery`, except for `throwOnError`, `enabled`, and
 * `placeholderData`.
 *
 * Caveat: cancellation does not work.
 *
 * @remarks Multiple `useSuspenseQuery` calls in the same component suspend serially, causing a request
 * waterfall — each one blocks rendering until it resolves, so the next doesn't even start fetching until then.
 * Use {@link useSuspenseQueries} instead when you have more than one suspenseful query in a component, so they
 * fetch in parallel.
 * @param options - The {@link UseSuspenseQueryOptions} to use — the same options as `useQuery`, minus the ones listed above.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The same object as `useQuery`, except that `data` is guaranteed to be defined, `isPlaceholderData`
 * is missing, and `status` is either `success` or `error` (with the derived flags set accordingly).
 *
 * @example
 * `data` is thrown as an error if the fetch fails, so an error boundary is required around `<Suspense>`.
 * Use {@link QueryErrorResetBoundary} to let the user retry after such an error:
 * ```tsx
 * import { Suspense } from 'preact/compat'
 * import { useErrorBoundary } from 'preact/hooks'
 * import { QueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/preact-query'
 * import type { ComponentChildren } from 'preact'
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
 *       <h1>Posts {isFetching ? '(refreshing...)' : null}</h1>
 *       <ul>
 *         {data.map((post) => (
 *           <li key={post.id}>{post.title}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 *
 * function App() {
 *   return (
 *     <QueryErrorResetBoundary>
 *       {({ reset }) => (
 *         <ErrorBoundary
 *           onReset={reset}
 *           fallbackRender={({ resetErrorBoundary }) => (
 *             <div>
 *               There was an error!
 *               <button onClick={() => resetErrorBoundary()}>Try again</button>
 *             </div>
 *           )}
 *         >
 *           <Suspense fallback={<h1>Loading posts...</h1>}>
 *             <Posts />
 *           </Suspense>
 *         </ErrorBoundary>
 *       )}
 *     </QueryErrorResetBoundary>
 *   )
 * }
 *
 * function ErrorBoundary({
 *   children,
 *   onReset,
 *   fallbackRender,
 * }: {
 *   children: ComponentChildren
 *   onReset: () => void
 *   fallbackRender: (props: {
 *     error: Error
 *     resetErrorBoundary: () => void
 *   }) => ComponentChildren
 * }) {
 *   const [error, resetErrorBoundary] = useErrorBoundary(() => onReset())
 *
 *   if (error) return fallbackRender({ error, resetErrorBoundary })
 *
 *   return children
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
