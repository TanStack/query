import type {
  DefaultError,
  QueryKey,
  QueryKeyWithDataTag,
} from '@tanstack/query-core'
import type { QueryOptions } from './types'
import type { Accessor } from 'solid-js'

/**
 * The options accepted by the `queryOptions` overload selected when no `initialData` is set — `data` may be
 * `undefined` while the query is `pending`. `queryOptions` itself accepts and returns a plain object (its
 * parameter type is `ReturnType<UndefinedInitialDataOptions<...>>`, i.e. this `Accessor` called); Solid's
 * reactivity applies where the result is consumed instead, e.g. `useQuery(() => options)`.
 *
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Accessor<
  QueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData?: undefined
  }
>

/**
 * The options accepted by the `queryOptions` overload selected when `initialData` is set — `data` is never
 * `undefined`.
 *
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Accessor<
  QueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData: TQueryFnData | (() => TQueryFnData)
  }
>

/**
 * You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
 * be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
 * is the query key to generate options for.
 *
 * This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.
 *
 * @see {@link useQuery} to run a query with these options.
 * @see [The Query Options API](https://tkdodo.eu/blog/the-query-options-api) for more on this pattern.
 * @param options - The {@link DefinedInitialDataOptions} to use — everything you can pass to `useQuery`, with `initialData` set.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * ```tsx
 * import { For } from 'solid-js'
 * import { queryOptions, useQuery } from '@tanstack/solid-query'
 *
 * const postsOptions = queryOptions({
 *   queryKey: ['posts'],
 *   queryFn: fetchPosts,
 *   initialData: [],
 * })
 *
 * function Posts() {
 *   // `postsQuery.data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
 *   // so the list stays visible alongside the error.
 *   const postsQuery = useQuery(() => postsOptions)
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
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: ReturnType<
    DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
): ReturnType<
  DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>

/**
 * You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
 * be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
 * is the query key to generate options for.
 *
 * @see {@link useQuery} to run a query with these options.
 * @see [The Query Options API](https://tkdodo.eu/blog/the-query-options-api) for more on this pattern.
 * @param options - The {@link UndefinedInitialDataOptions} to use — everything you can pass to `useQuery`.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * A parameterized factory, so the same options object can be reused per `id`:
 * ```tsx
 * import { Match, Switch } from 'solid-js'
 * import { queryOptions, useQuery } from '@tanstack/solid-query'
 *
 * const postOptions = (id: string) =>
 *   queryOptions({
 *     queryKey: ['post', id],
 *     queryFn: () => fetchPost(id),
 *   })
 *
 * function Post(props: { id: string }) {
 *   const postQuery = useQuery(() => postOptions(props.id))
 *
 *   return (
 *     <Switch>
 *       <Match when={postQuery.isPending}>Loading...</Match>
 *       <Match when={postQuery.isError}>Error: {postQuery.error.message}</Match>
 *       <Match when={postQuery.isSuccess}>
 *         <h1>{postQuery.data.title}</h1>
 *       </Match>
 *     </Switch>
 *   )
 * }
 * ```
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: ReturnType<
    UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
): ReturnType<
  UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>

export function queryOptions(options: unknown) {
  return options
}
