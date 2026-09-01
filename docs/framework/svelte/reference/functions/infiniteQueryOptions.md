---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>;
```

Defined in: [packages/svelte-query/src/infiniteQueryOptions.ts:78](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/infiniteQueryOptions.ts#L78)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to `createInfiniteQuery`.
These options can be shared across `createInfiniteQuery` calls and imperative APIs such as
`queryClient.infiniteQuery`. `options.queryKey` is required and is the query key to generate options for.

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TError

`TError` = `Error`

### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### TPageParam

`TPageParam` = `unknown`

## Parameters

### options

[`CreateInfiniteQueryOptions`](../type-aliases/CreateInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [CreateInfiniteQueryOptions](../type-aliases/CreateInfiniteQueryOptions.md) to use — everything you can pass to
`createInfiniteQuery`.

## Returns

[`CreateInfiniteQueryOptions`](../type-aliases/CreateInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The same options object.

## See

[createInfiniteQuery](createInfiniteQuery.md) to run an infinite query with these options.

## Examples

`initialData` skips the loading state on first render — even if a refetch fails, the list stays
visible alongside the error:
```svelte
<script lang="ts">
  import { infiniteQueryOptions, createInfiniteQuery } from '@tanstack/svelte-query'

  const projectsOptions = infiniteQueryOptions({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
    initialData: { pages: [], pageParams: [] },
  })

  const query = createInfiniteQuery(() => projectsOptions)
</script>

{#if query.isError}
  <span>Error: {query.error.message}</span>
{/if}
<ul>
  {#each query.data?.pages ?? [] as page}
    {#each page.projects as project (project.id)}
      <li>{project.name}</li>
    {/each}
  {/each}
</ul>
```

A parameterized factory, so the same options object can be reused per `postId`:
```svelte
<script lang="ts">
  import { infiniteQueryOptions, createInfiniteQuery } from '@tanstack/svelte-query'

  let { postId }: { postId: string } = $props()

  const commentsOptions = (postId: string) =>
    infiniteQueryOptions({
      queryKey: ['post', postId, 'comments'],
      queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextId,
    })

  const query = createInfiniteQuery(() => commentsOptions(postId))
</script>

{#if query.isPending}
  Loading...
{:else if query.isError}
  <span>Error: {query.error.message}</span>
{:else}
  <ul>
    {#each query.data.pages as page}
      {#each page.comments as comment (comment.id)}
        <li>{comment.text}</li>
      {/each}
    {/each}
  </ul>
{/if}
```
