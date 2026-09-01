import type { DefaultError, InfiniteData, QueryKey } from '@tanstack/query-core'
import type { CreateInfiniteQueryOptions } from './types.js'

/**
 * You can generally pass everything to `infiniteQueryOptions` that you can also pass to `createInfiniteQuery`.
 * These options can be shared across `createInfiniteQuery` calls and imperative APIs such as
 * `queryClient.infiniteQuery`. `options.queryKey` is required and is the query key to generate options for.
 *
 * @see {@link createInfiniteQuery} to run an infinite query with these options.
 * @param options - The {@link CreateInfiniteQueryOptions} to use — everything you can pass to
 * `createInfiniteQuery`.
 * @returns The same options object.
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
 *   {#each query.data?.pages ?? [] as page}
 *     {#each page.projects as project (project.id)}
 *       <li>{project.name}</li>
 *     {/each}
 *   {/each}
 * </ul>
 * ```
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
  options: CreateInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): CreateInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> {
  return options
}
