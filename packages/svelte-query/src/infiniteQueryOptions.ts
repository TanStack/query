import type {
  DefaultError,
  InfiniteData,
  InitialDataFunction,
  NonUndefinedGuard,
  QueryKey,
  QueryKeyWithDataTag,
} from '@tanstack/query-core'
import type { CreateInfiniteQueryOptions } from './types.js'

export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = CreateInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> & {
  initialData?:
    | undefined
    | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
    | InitialDataFunction<
        NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
      >
}

export type DefinedInitialDataInfiniteOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = CreateInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> & {
  initialData:
    | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
    | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>)
}

/**
 * You can generally pass everything to `infiniteQueryOptions` that you can also pass to `createInfiniteQuery`.
 * These options can be shared across `createInfiniteQuery` calls and imperative APIs such as
 * `queryClient.infiniteQuery`. `options.queryKey` is required and is the query key to generate options for.
 *
 * This overload is selected when `initialData` is set.
 *
 * @see {@link createInfiniteQuery} to run an infinite query with these options.
 * @param options - The {@link DefinedInitialDataInfiniteOptions} to use — everything you can pass to
 * `createInfiniteQuery`, with `initialData` set.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * `initialData` skips the loading state on first render — even if a refetch fails, the list stays
 * visible alongside the error:
 * ```svelte
 * <script lang="ts">
 *   import { infiniteQueryOptions, createInfiniteQuery } from '@tanstack/svelte-query'
 *
 *   const projectsOptions = infiniteQueryOptions({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *     initialData: { pages: [], pageParams: [] },
 *   })
 *
 *   const query = createInfiniteQuery(() => projectsOptions)
 * </script>
 *
 * {#if query.isError}
 *   <span>Error: {query.error.message}</span>
 * {/if}
 * <ul>
 *   {#each query.data.pages as page}
 *     {#each page.projects as project (project.id)}
 *       <li>{project.name}</li>
 *     {/each}
 *   {/each}
 * </ul>
 * ```
 */
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> &
  QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>

/**
 * You can generally pass everything to `infiniteQueryOptions` that you can also pass to `createInfiniteQuery`.
 * These options can be shared across `createInfiniteQuery` calls and imperative APIs such as
 * `queryClient.infiniteQuery`. `options.queryKey` is required and is the query key to generate options for.
 *
 * @see {@link createInfiniteQuery} to run an infinite query with these options.
 * @param options - The {@link UndefinedInitialDataInfiniteOptions} to use — everything you can pass to
 * `createInfiniteQuery`.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * A parameterized factory, so the same options object can be reused per `postId`:
 * ```svelte
 * <script lang="ts">
 *   import { infiniteQueryOptions, createInfiniteQuery } from '@tanstack/svelte-query'
 *
 *   let { postId }: { postId: string } = $props()
 *
 *   const commentsOptions = (postId: string) =>
 *     infiniteQueryOptions({
 *       queryKey: ['post', postId, 'comments'],
 *       queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
 *       initialPageParam: 0,
 *       getNextPageParam: (lastPage) => lastPage.nextId,
 *     })
 *
 *   const query = createInfiniteQuery(() => commentsOptions(postId))
 * </script>
 *
 * {#if query.isPending}
 *   Loading...
 * {:else if query.isError}
 *   <span>Error: {query.error.message}</span>
 * {:else}
 *   <ul>
 *     {#each query.data.pages as page}
 *       {#each page.comments as comment (comment.id)}
 *         <li>{comment.text}</li>
 *       {/each}
 *     {/each}
 *   </ul>
 * {/if}
 * ```
 */
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> &
  QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>

export function infiniteQueryOptions(options: unknown) {
  return options
}
