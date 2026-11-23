'use client'
import { QueryObserver, skipToken } from '@tanstack/query-core'
import { defaultThrowOnError, suspenseQueryPolicy } from './suspense'
import { useBaseQuery } from './useBaseQuery'
import type {
  DefaultError,
  OmitKeyof,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core'
import type {
  UseQueryOptions,
  UseQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from './types'

type SkippableSuspenseQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
> = OmitKeyof<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'enabled' | 'throwOnError'
>

/**
 * Runs a query with Suspense. The options match those of `useQuery` except for `throwOnError` and `enabled`.
 *
 * Caveat: cancellation does not work.
 * @param options - The {@link UseSuspenseQueryOptions} for a query that always runs.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns A result with data of type `TData` and a status of `success` or `error`.
 * @remarks Multiple `useSuspenseQuery` calls in the same component suspend serially, causing a request
 * waterfall — each one blocks rendering until it resolves, so the next doesn't even start fetching until then.
 * Use {@link useSuspenseQueries} instead when you have more than one suspenseful query in a component, so they
 * fetch in parallel.
 * @example
 * The query error is thrown if the fetch fails and no cached data exists yet, so an error boundary is
 * required around `<Suspense>`. A failed background refetch instead continues to render the cached data.
 * Use {@link QueryErrorResetBoundary} to let the user retry after such an error:
 * ```tsx
 * import { Suspense } from 'react'
 * import { ErrorBoundary } from 'react-error-boundary'
 * import { QueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query'
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
): UseSuspenseQueryResult<TData, TError>

/**
 * Pass `skipToken` as `queryFn` to skip the query. While skipped, the query can read cached data
 * but does not fetch automatically or suspend. Query errors without cached data reach the nearest error boundary.
 * Pass a query function to resume normal Suspense behavior.
 * @param options - Options for a query that can be skipped.
 * @param queryClient - The client to use. Defaults to the client from the nearest context.
 * @returns A result whose data can be undefined and whose status can be `pending`.
 */
export function useSuspenseQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: SkippableSuspenseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
  queryClient?: QueryClient,
): UseQueryResult<TData, TError>

export function useSuspenseQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: SkippableSuspenseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> {
  const skipped = options.queryFn === skipToken

  return useBaseQuery(
    {
      ...options,
      enabled: !skipped,
      throwOnError: defaultThrowOnError,
    },
    QueryObserver,
    queryClient,
    skipped ? undefined : suspenseQueryPolicy,
  )
}
