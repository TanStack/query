import { QueryObserver } from '@tanstack/query-core'
import { createMemo } from 'solid-js'
import { useBaseQuery } from './useBaseQuery'
import type { DefaultError, QueryKey } from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type { Accessor } from 'solid-js'
import type {
  DefinedUseQueryResult,
  UseQueryOptions,
  UseQueryResult,
} from './types'
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'

/**
 * @see {@link queryOptions} to share these options between `useQuery` and imperative APIs like `queryClient.query`.
 * @param options - An accessor returning the {@link UndefinedInitialDataOptions} to use — everything you can
 * pass to `useQuery`.
 * @param queryClient - An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
 * will be used.
 * @returns The current query result, as a Solid store. `status` is `pending` if there is no cached data to
 * display, `error` if the last fetch attempt failed, or `success` if the query has data to display.
 * `isPending`/`isSuccess`/`isError` are derived booleans for convenience.
 *
 * @example
 * ```tsx
 * import { For, Match, Switch } from 'solid-js'
 * import { useQuery } from '@tanstack/solid-query'
 *
 * function Posts() {
 *   const postsQuery = useQuery(() => ({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *   }))
 *
 *   return (
 *     <Switch>
 *       <Match when={postsQuery.isPending}>Loading...</Match>
 *       <Match when={postsQuery.isError}>Error: {postsQuery.error.message}</Match>
 *       <Match when={postsQuery.isSuccess}>
 *         <ul>
 *           <For each={postsQuery.data}>{(post) => <li>{post.title}</li>}</For>
 *         </ul>
 *         <div>{postsQuery.isFetching ? 'Background Updating...' : ' '}</div>
 *       </Match>
 *     </Switch>
 *   )
 * }
 * ```
 *
 * @example
 * `select` derives whatever `data` a component needs from the cached value, without changing what's
 * actually stored in the cache — the cache still holds the full `Post[]`, but `data` here is a `number`:
 * ```tsx
 * import { Match, Switch } from 'solid-js'
 * import { useQuery } from '@tanstack/solid-query'
 *
 * function PostCount() {
 *   const postsQuery = useQuery(() => ({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *     select: (posts) => posts.length,
 *   }))
 *
 *   return (
 *     <Switch>
 *       <Match when={postsQuery.isPending}>Loading...</Match>
 *       <Match when={postsQuery.isError}>Error: {postsQuery.error.message}</Match>
 *       <Match when={postsQuery.isSuccess}>{postsQuery.data} posts</Match>
 *     </Switch>
 *   )
 * }
 * ```
 *
 * @example
 * A dependent query, only enabled once `postId` is set:
 * ```tsx
 * import { Match, Switch } from 'solid-js'
 * import { useQuery } from '@tanstack/solid-query'
 *
 * function Post(props: { postId: number | undefined }) {
 *   const postQuery = useQuery(() => ({
 *     queryKey: ['post', props.postId],
 *     queryFn: () => fetchPost(props.postId!),
 *     enabled: props.postId != null,
 *   }))
 *
 *   return (
 *     <Switch fallback={<h1>{postQuery.data?.title}</h1>}>
 *       <Match when={props.postId == null}>Select a post</Match>
 *       <Match when={postQuery.isLoading}>Loading...</Match>
 *       <Match when={postQuery.isError}>Error: {postQuery.error.message}</Match>
 *     </Switch>
 *   )
 * }
 * ```
 *
 * @example
 * The same dependent query, using `skipToken` to disable it in a type-safe way instead of relying on
 * `enabled`. The non-null assertion is still needed — Solid's `props` narrowing doesn't survive into the
 * `queryFn` closure the way a local `const` would — but `skipToken` keeps `queryFn`'s return type accurate
 * without it. `refetch` doesn't work while `queryFn` is `skipToken` — use `enabled: false` instead if you
 * need to trigger the query manually:
 * ```tsx
 * import { Match, Switch } from 'solid-js'
 * import { skipToken, useQuery } from '@tanstack/solid-query'
 *
 * function Post(props: { postId: number | undefined }) {
 *   const postQuery = useQuery(() => ({
 *     queryKey: ['post', props.postId],
 *     queryFn: props.postId != null ? () => fetchPost(props.postId!) : skipToken,
 *   }))
 *
 *   return (
 *     <Switch fallback={<h1>{postQuery.data?.title}</h1>}>
 *       <Match when={props.postId == null}>Select a post</Match>
 *       <Match when={postQuery.isLoading}>Loading...</Match>
 *       <Match when={postQuery.isError}>Error: {postQuery.error.message}</Match>
 *     </Switch>
 *   )
 * }
 * ```
 *
 * @example
 * Seeding a detail query from an already-cached list, to skip the loading state:
 * ```tsx
 * import { useQuery, useQueryClient } from '@tanstack/solid-query'
 *
 * function Post(props: { postId: number }) {
 *   const queryClient = useQueryClient()
 *
 *   const postQuery = useQuery(() => ({
 *     queryKey: ['post', props.postId],
 *     queryFn: () => fetchPost(props.postId),
 *     initialData: () =>
 *       queryClient
 *         .getQueryData<Array<Post>>(['posts'])
 *         ?.find((post) => post.id === props.postId),
 *   }))
 *
 *   return postQuery.isError ? <span>Error: {postQuery.error.message}</span> : <h1>{postQuery.data?.title}</h1>
 * }
 * ```
 *
 * @example
 * Paginated data, keeping the previous page's data visible while the next page loads:
 * ```tsx
 * import { For, createSignal } from 'solid-js'
 * import { keepPreviousData, useQuery } from '@tanstack/solid-query'
 *
 * function Posts() {
 *   const [page, setPage] = createSignal(0)
 *
 *   const postsQuery = useQuery(() => ({
 *     queryKey: ['posts', page()],
 *     queryFn: () => fetchPosts(page()),
 *     placeholderData: keepPreviousData,
 *   }))
 *
 *   return (
 *     <div>
 *       <ul>
 *         <For each={postsQuery.data}>{(post) => <li>{post.title}</li>}</For>
 *       </ul>
 *       <button
 *         disabled={postsQuery.isPlaceholderData}
 *         onClick={() => setPage((old) => old + 1)}
 *       >
 *         Next Page
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: () => QueryClient,
): UseQueryResult<TData, TError>

/**
 * This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.
 *
 * @see {@link queryOptions} to share these options between `useQuery` and imperative APIs like `queryClient.query`.
 * @param options - An accessor returning the {@link DefinedInitialDataOptions} to use — everything you can
 * pass to `useQuery`, with `initialData` set.
 * @param queryClient - An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
 * will be used.
 * @returns The current query result, as a Solid store, typed so that `status` is `success` — or `error` if a
 * fetch attempt fails while keeping the existing data (`status` never resolves to `pending` in this overload's
 * type, since `initialData` guarantees data upfront). `isSuccess`/`isError` are derived booleans for
 * convenience.
 *
 * @example
 * ```tsx
 * import { For } from 'solid-js'
 * import { useQuery } from '@tanstack/solid-query'
 *
 * function Posts() {
 *   // `postsQuery.data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
 *   // list stays visible alongside the error.
 *   const postsQuery = useQuery(() => ({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *     initialData: [],
 *   }))
 *
 *   return (
 *     <div>
 *       {postsQuery.isError ? <span>Error: {postsQuery.error.message}</span> : null}
 *       <ul>
 *         <For each={postsQuery.data}>{(post) => <li>{post.title}</li>}</For>
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: () => QueryClient,
): DefinedUseQueryResult<TData, TError>
export function useQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: Accessor<QueryClient>,
) {
  return useBaseQuery(
    createMemo(() => options()),
    QueryObserver,
    queryClient,
  )
}
