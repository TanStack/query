import type {
  DefaultError,
  InfiniteData,
  NonUndefinedGuard,
  QueryKey,
  QueryKeyWithDataTag,
} from '@tanstack/query-core'
import type { InfiniteQueryOptions } from './types'
import type { Accessor } from 'solid-js'

/**
 * The options accepted by the `infiniteQueryOptions` overload selected when no `initialData` is set — `data`
 * may be `undefined` while the query is `pending`. `infiniteQueryOptions` itself accepts and returns a plain
 * object (its parameter type is `ReturnType<UndefinedInitialDataInfiniteOptions<...>>`, i.e. this `Accessor`
 * called); Solid's reactivity applies where the result is consumed instead, e.g.
 * `useInfiniteQuery(() => options)`.
 *
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
 * the shape of all fetched pages plus their page params.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Accessor<
  InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
    initialData?: undefined
  }
>

/**
 * The options accepted by the `infiniteQueryOptions` overload selected when `initialData` is set — `data` is
 * never `undefined`.
 *
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
 * the shape of all fetched pages plus their page params.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
export type DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  // should we handle page param correctly
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Accessor<
  InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
    initialData:
      | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
      | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>)
  }
>

/**
 * You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
 * These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
 * `options.queryKey` is required and is the query key to generate options for.
 *
 * This overload is selected when `initialData` is set.
 *
 * @see {@link useInfiniteQuery} to run an infinite query with these options.
 * @param options - The {@link DefinedInitialDataInfiniteOptions} to use — everything you can pass to `useInfiniteQuery`, with `initialData` set.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * ```tsx
 * import { For } from 'solid-js'
 * import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/solid-query'
 *
 * const projectsOptions = infiniteQueryOptions({
 *   queryKey: ['projects'],
 *   queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *   initialPageParam: 0,
 *   getNextPageParam: (lastPage) => lastPage.nextId,
 *   initialData: { pages: [], pageParams: [] },
 * })
 *
 * function Projects() {
 *   // `projectsQuery.data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
 *   // list stays visible alongside the error.
 *   const projectsQuery = useInfiniteQuery(() => projectsOptions)
 *
 *   return (
 *     <div>
 *       {projectsQuery.isError ? <span>Error: {projectsQuery.error.message}</span> : null}
 *       <ul>
 *         <For each={projectsQuery.data.pages}>
 *           {(page) => <For each={page.projects}>{(p) => <li>{p.name}</li>}</For>}
 *         </For>
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 */
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: ReturnType<
    DefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  >,
): ReturnType<
  DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >
> &
  QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>

/**
 * You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
 * These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
 * `options.queryKey` is required and is the query key to generate options for.
 *
 * @see {@link useInfiniteQuery} to run an infinite query with these options.
 * @param options - The {@link UndefinedInitialDataInfiniteOptions} to use — everything you can pass to `useInfiniteQuery`.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * A parameterized factory, so the same options object can be reused per `postId`:
 * ```tsx
 * import { For, Match, Switch } from 'solid-js'
 * import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/solid-query'
 *
 * const commentsOptions = (postId: string) =>
 *   infiniteQueryOptions({
 *     queryKey: ['post', postId, 'comments'],
 *     queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *   })
 *
 * function Comments(props: { postId: string }) {
 *   const commentsQuery = useInfiniteQuery(() => commentsOptions(props.postId))
 *
 *   return (
 *     <Switch>
 *       <Match when={commentsQuery.isPending}>Loading...</Match>
 *       <Match when={commentsQuery.isError}>Error: {commentsQuery.error.message}</Match>
 *       <Match when={commentsQuery.isSuccess}>
 *         <ul>
 *           <For each={commentsQuery.data.pages}>
 *             {(page) => <For each={page.comments}>{(c) => <li>{c.text}</li>}</For>}
 *           </For>
 *         </ul>
 *       </Match>
 *     </Switch>
 *   )
 * }
 * ```
 */
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: ReturnType<
    UndefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  >,
): ReturnType<
  UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >
> &
  QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>

export function infiniteQueryOptions(options: unknown) {
  return options
}
