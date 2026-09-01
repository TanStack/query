import { InfiniteQueryObserver } from '@tanstack/query-core'
import { createBaseQuery } from './createBaseQuery.svelte.js'
import type {
  DefaultError,
  InfiniteData,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import type {
  Accessor,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
} from './types.js'

/**
 * @see {@link infiniteQueryOptions} to share these options between `createInfiniteQuery` and imperative APIs
 * like `queryClient.infiniteQuery`.
 * @param options - The {@link CreateInfiniteQueryOptions} to use — everything you can pass to
 * `createInfiniteQuery`, wrapped in an {@link Accessor} so options can be reactive.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current query result, plus `fetchNextPage`/`fetchPreviousPage`/`hasNextPage`/`hasPreviousPage`
 * to page through the query.
 *
 * @example
 * Fetching the next page from a "Load More" button click:
 * ```svelte
 * <script lang="ts">
 *   import { createInfiniteQuery } from '@tanstack/svelte-query'
 *
 *   const query = createInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *   }))
 * </script>
 *
 * {#if query.isPending}
 *   Loading...
 * {:else if query.isError}
 *   <span>Error: {query.error.message}</span>
 * {:else}
 *   <ul>
 *     {#each query.data.pages as page}
 *       {#each page.projects as project (project.id)}
 *         <li>{project.name}</li>
 *       {/each}
 *     {/each}
 *   </ul>
 *   <button
 *     onclick={() => query.fetchNextPage()}
 *     disabled={!query.hasNextPage || query.isFetching}
 *   >
 *     {query.isFetchingNextPage
 *       ? 'Loading more...'
 *       : query.hasNextPage
 *         ? 'Load More'
 *         : 'Nothing more to load'}
 *   </button>
 * {/if}
 * ```
 *
 * @example
 * Fetching the next page automatically as the user scrolls, using an `IntersectionObserver` on a
 * sentinel element after the list:
 * ```svelte
 * <script lang="ts">
 *   import { createInfiniteQuery } from '@tanstack/svelte-query'
 *
 *   const query = createInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *   }))
 *
 *   let sentinel: HTMLDivElement | undefined = $state()
 *
 *   $effect(() => {
 *     if (sentinel == null || !query.hasNextPage || query.isFetching) return
 *
 *     const observer = new IntersectionObserver(([entry]) => {
 *       if (entry?.isIntersecting) query.fetchNextPage()
 *     })
 *     observer.observe(sentinel)
 *
 *     return () => observer.disconnect()
 *   })
 * </script>
 *
 * {#if query.isPending}
 *   Loading...
 * {:else if query.isError}
 *   <span>Error: {query.error.message}</span>
 * {:else}
 *   <ul>
 *     {#each query.data.pages as page}
 *       {#each page.projects as project (project.id)}
 *         <li>{project.name}</li>
 *       {/each}
 *     {/each}
 *   </ul>
 *   <div bind:this={sentinel}></div>
 * {/if}
 * ```
 */
export function createInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: Accessor<
    CreateInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  >,
  queryClient?: Accessor<QueryClient>,
): CreateInfiniteQueryResult<TData, TError> {
  return createBaseQuery(
    options,
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as CreateInfiniteQueryResult<TData, TError>
}
