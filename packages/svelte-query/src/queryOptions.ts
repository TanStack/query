import type {
  DefaultError,
  InitialDataFunction,
  NonUndefinedGuard,
  QueryKey,
  QueryKeyWithDataTag,
} from '@tanstack/query-core'
import type { CreateQueryOptions } from './types.js'

export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData?: undefined | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
}

export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
}

/**
 * You can generally pass everything to `queryOptions` that you can also pass to `createQuery`. These options
 * can be shared across `createQuery` calls and imperative APIs such as `queryClient.query`. `options.queryKey`
 * is required and is the query key to generate options for.
 *
 * This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.
 *
 * @see {@link createQuery} to run a query with these options.
 * @param options - The {@link DefinedInitialDataOptions} to use — everything you can pass to `createQuery`,
 * with `initialData` set.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { queryOptions, createQuery } from '@tanstack/svelte-query'
 *
 *   const postsOptions = queryOptions({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *     initialData: [],
 *   })
 *
 *   // `data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
 *   // so the list stays visible alongside the error.
 *   const query = createQuery(() => postsOptions)
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
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>

/**
 * You can generally pass everything to `queryOptions` that you can also pass to `createQuery`. These options
 * can be shared across `createQuery` calls and imperative APIs such as `queryClient.query`. `options.queryKey`
 * is required and is the query key to generate options for.
 *
 * @see {@link createQuery} to run a query with these options.
 * @param options - The {@link UndefinedInitialDataOptions} to use — everything you can pass to `createQuery`.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * A parameterized factory, so the same options object can be reused per `id`:
 * ```svelte
 * <script lang="ts">
 *   import { queryOptions, createQuery } from '@tanstack/svelte-query'
 *
 *   let { id }: { id: string } = $props()
 *
 *   const postOptions = (id: string) =>
 *     queryOptions({
 *       queryKey: ['post', id],
 *       queryFn: () => fetchPost(id),
 *     })
 *
 *   const query = createQuery(() => postOptions(id))
 * </script>
 *
 * {#if query.isPending}
 *   Loading...
 * {:else if query.isError}
 *   <span>Error: {query.error.message}</span>
 * {:else}
 *   <h1>{query.data.title}</h1>
 * {/if}
 * ```
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>

export function queryOptions(options: unknown) {
  return options
}
