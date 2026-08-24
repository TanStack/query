import { InfiniteQueryObserver, skipToken } from '@tanstack/query-core'
import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryObserverSuccessResult,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'

import { defaultThrowOnError } from './suspense'
import type {
  UseSuspenseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryResult,
} from './types'
import { useBaseQuery } from './useBaseQuery'

/**
 * The options for `useSuspenseInfiniteQuery` are the same as for `useInfiniteQuery`, except for `throwOnError`,
 * `enabled`, and `placeholderData`.
 *
 * @param options - The {@link UseSuspenseInfiniteQueryOptions} to use — the same options as `useInfiniteQuery`, minus the ones listed above.
 * @param queryClient - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
 * be used.
 * @returns The same object as `useInfiniteQuery`, except that `data` is guaranteed to be defined,
 * `isPlaceholderData` is missing, and `status` is either `success` or `error` (with the derived flags set
 * accordingly).
 *
 * Caveat: cancellation does not work.
 *
 * @example
 * ```tsx
 * import { Suspense } from 'preact/compat'
 * import { useSuspenseInfiniteQuery } from '@tanstack/preact-query'
 *
 * function Projects() {
 *   // `data` is guaranteed to be defined here — no `isPending` check needed.
 *   const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *   })
 *
 *   return (
 *     <div>
 *       {data.pages.map((page) =>
 *         page.projects.map((project) => <p key={project.id}>{project.name}</p>),
 *       )}
 *       <button onClick={() => fetchNextPage()} disabled={!hasNextPage}>
 *         Load More
 *       </button>
 *     </div>
 *   )
 * }
 *
 * function App() {
 *   return (
 *     <Suspense fallback={<h1>Loading projects...</h1>}>
 *       <Projects />
 *     </Suspense>
 *   )
 * }
 * ```
 */
export function useSuspenseInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseSuspenseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseSuspenseInfiniteQueryResult<TData, TError> {
  if (process.env.NODE_ENV !== 'production') {
    if ((options.queryFn as any) === skipToken) {
      console.error('skipToken is not allowed for useSuspenseInfiniteQuery')
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
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as InfiniteQueryObserverSuccessResult<TData, TError>
}
