import { QueryObserver } from '@tanstack/query-core'
import { createBaseQuery } from './createBaseQuery.svelte.js'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'
import type {
  Accessor,
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
} from './types.js'
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions.js'

/**
 * @see {@link queryOptions} to share these options between `createQuery` and imperative APIs like `queryClient.query`.
 * @param options - The {@link UndefinedInitialDataOptions} to use — everything you can pass to `createQuery`,
 * wrapped in an {@link Accessor} so options can be reactive.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current query result. `status` is `pending` if there is no cached data and no query attempt
 * has finished yet, `error` if the query attempt resulted in an error, or `success` if the query has data to
 * display. `isPending`/`isSuccess`/`isError` are derived booleans for convenience.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createQuery } from '@tanstack/svelte-query'
 *
 *   const query = createQuery(() => ({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *   }))
 * </script>
 *
 * {#if query.status === 'pending'}
 *   Loading...
 * {:else if query.status === 'error'}
 *   <span>Error: {query.error.message}</span>
 * {:else}
 *   <ul>
 *     {#each query.data as post (post.id)}
 *       <li>{post.title}</li>
 *     {/each}
 *   </ul>
 * {/if}
 * ```
 */
export function createQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Accessor<
    UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  queryClient?: Accessor<QueryClient>,
): CreateQueryResult<TData, TError>

/**
 * This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.
 *
 * @see {@link queryOptions} to share these options between `createQuery` and imperative APIs like `queryClient.query`.
 * @param options - The {@link DefinedInitialDataOptions} to use — everything you can pass to `createQuery`,
 * with `initialData` set, wrapped in an {@link Accessor} so options can be reactive.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current query result, typed so that `status` is `success` — or `error` if a fetch attempt
 * fails while keeping the existing data (`status` never resolves to `pending` in this overload's type,
 * since `initialData` guarantees data upfront). `isSuccess`/`isError` are derived booleans for convenience.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createQuery } from '@tanstack/svelte-query'
 *
 *   // `data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
 *   // so the list stays visible alongside the error.
 *   const query = createQuery(() => ({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *     initialData: [],
 *   }))
 * </script>
 *
 * {#if query.isError}
 *   <span>Error: {query.error.message}</span>
 * {/if}
 * <ul>
 *   {#each query.data as post (post.id)}
 *     <li>{post.title}</li>
 *   {/each}
 * </ul>
 * ```
 */
export function createQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Accessor<
    DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  queryClient?: Accessor<QueryClient>,
): DefinedCreateQueryResult<TData, TError>

/**
 * @see {@link queryOptions} to share these options between `createQuery` and imperative APIs like `queryClient.query`.
 * @param options - The {@link CreateQueryOptions} to use — everything you can pass to `createQuery`, wrapped
 * in an {@link Accessor} so options can be reactive.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current query result. `status` is `pending` if there is no cached data and no query attempt
 * has finished yet, `error` if the query attempt resulted in an error, or `success` if the query has data to
 * display. `isPending`/`isSuccess`/`isError` are derived booleans for convenience.
 *
 * @example
 * `select` derives whatever `data` a component needs from the cached value, without changing what's
 * actually stored in the cache — the cache still holds the full `Post[]`, but `data` here is a `number`:
 * ```svelte
 * <script lang="ts">
 *   import { createQuery } from '@tanstack/svelte-query'
 *
 *   const query = createQuery(() => ({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *     select: (posts) => posts.length,
 *   }))
 * </script>
 *
 * {#if query.isPending}
 *   Loading...
 * {:else if query.isError}
 *   <span>Error: {query.error.message}</span>
 * {:else}
 *   <span>{query.data} posts</span>
 * {/if}
 * ```
 *
 * @example
 * A dependent query, only enabled once `postId` is set — use `isLoading`, not `isPending`, so the
 * loading state doesn't show while the query is disabled:
 * ```svelte
 * <script lang="ts">
 *   import { createQuery } from '@tanstack/svelte-query'
 *
 *   let { postId }: { postId: number | undefined } = $props()
 *
 *   const query = createQuery(() => ({
 *     queryKey: ['post', postId],
 *     queryFn: () => fetchPost(postId!),
 *     enabled: postId != null,
 *   }))
 * </script>
 *
 * {#if postId == null}
 *   Select a post
 * {:else if query.isLoading}
 *   Loading...
 * {:else if query.isError}
 *   <span>Error: {query.error.message}</span>
 * {:else}
 *   <h1>{query.data?.title}</h1>
 * {/if}
 * ```
 *
 * @example
 * Seeding a detail query from an already-cached list, to skip the loading state:
 * ```svelte
 * <script lang="ts">
 *   import { createQuery, useQueryClient } from '@tanstack/svelte-query'
 *
 *   let { postId }: { postId: number } = $props()
 *
 *   const queryClient = useQueryClient()
 *
 *   const query = createQuery(() => ({
 *     queryKey: ['post', postId],
 *     queryFn: () => fetchPost(postId),
 *     initialData: () =>
 *       queryClient
 *         .getQueryData<Array<Post>>(['posts'])
 *         ?.find((post) => post.id === postId),
 *   }))
 * </script>
 *
 * {#if query.isError}
 *   <span>Error: {query.error.message}</span>
 * {/if}
 * <h1>{query.data?.title}</h1>
 * ```
 *
 * @example
 * Paginated data, keeping the previous page's data visible while the next page loads:
 * ```svelte
 * <script lang="ts">
 *   import { createQuery, keepPreviousData } from '@tanstack/svelte-query'
 *
 *   let page = $state(0)
 *
 *   const query = createQuery(() => ({
 *     queryKey: ['posts', page],
 *     queryFn: () => fetchPosts(page),
 *     placeholderData: keepPreviousData,
 *   }))
 * </script>
 *
 * {#if query.isError}
 *   <span>Error: {query.error.message}</span>
 * {/if}
 * <ul>
 *   {#each query.data ?? [] as post (post.id)}
 *     <li>{post.title}</li>
 *   {/each}
 * </ul>
 * <button disabled={query.isPlaceholderData} onclick={() => page++}>
 *   Next Page
 * </button>
 * ```
 */
export function createQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Accessor<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>>,
  queryClient?: Accessor<QueryClient>,
): CreateQueryResult<TData, TError>

export function createQuery(
  options: Accessor<CreateQueryOptions>,
  queryClient?: Accessor<QueryClient>,
) {
  return createBaseQuery(options, QueryObserver, queryClient)
}
