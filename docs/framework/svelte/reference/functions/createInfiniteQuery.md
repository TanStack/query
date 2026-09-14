---
id: createInfiniteQuery
title: createInfiniteQuery
---

## Call Signature

```ts
function createInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): DefinedCreateInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/svelte-query/src/createInfiniteQuery.ts:21](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createInfiniteQuery.ts#L21)

### Type Parameters

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`Accessor`](../type-aliases/Accessor.md)\<[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

#### queryClient?

[`Accessor`](../type-aliases/Accessor.md)\<[`QueryClient`](../classes/QueryClient.md)\>

### Returns

[`DefinedCreateInfiniteQueryResult`](../type-aliases/DefinedCreateInfiniteQueryResult.md)\<`TData`, `TError`\>

## Call Signature

```ts
function createInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): CreateInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/svelte-query/src/createInfiniteQuery.ts:40](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createInfiniteQuery.ts#L40)

### Type Parameters

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`Accessor`](../type-aliases/Accessor.md)\<[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

#### queryClient?

[`Accessor`](../type-aliases/Accessor.md)\<[`QueryClient`](../classes/QueryClient.md)\>

### Returns

[`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>

## Call Signature

```ts
function createInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): CreateInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/svelte-query/src/createInfiniteQuery.ts:152](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createInfiniteQuery.ts#L152)

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`Accessor`](../type-aliases/Accessor.md)\<[`CreateInfiniteQueryOptions`](../type-aliases/CreateInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

The [CreateInfiniteQueryOptions](../type-aliases/CreateInfiniteQueryOptions.md) to use — everything you can pass to
`createInfiniteQuery`, wrapped in an [Accessor](../type-aliases/Accessor.md) so options can be reactive.

#### queryClient?

[`Accessor`](../type-aliases/Accessor.md)\<[`QueryClient`](../classes/QueryClient.md)\>

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>

The current query result, plus `fetchNextPage`/`fetchPreviousPage`/`hasNextPage`/`hasPreviousPage`
to page through the query.

### See

[infiniteQueryOptions](infiniteQueryOptions.md) to share these options between `createInfiniteQuery` and imperative APIs
like `queryClient.infiniteQuery`.

### Examples

Fetching the next page from a "Load More" button click:
```svelte
<script lang="ts">
  import { createInfiniteQuery } from '@tanstack/svelte-query'

  const query = createInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  }))
</script>

{#if query.isPending}
  Loading...
{:else if query.isError}
  <span>Error: {query.error.message}</span>
{:else}
  <ul>
    {#each query.data.pages as page}
      {#each page.projects as project (project.id)}
        <li>{project.name}</li>
      {/each}
    {/each}
  </ul>
  <button
    onclick={() => query.fetchNextPage()}
    disabled={!query.hasNextPage || query.isFetching}
  >
    {query.isFetchingNextPage
      ? 'Loading more...'
      : query.hasNextPage
        ? 'Load More'
        : 'Nothing more to load'}
  </button>
{/if}
```

Fetching the next page automatically as the user scrolls, using an `IntersectionObserver` on a
sentinel element after the list:
```svelte
<script lang="ts">
  import { createInfiniteQuery } from '@tanstack/svelte-query'

  const query = createInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  }))

  let sentinel: HTMLDivElement | undefined = $state()

  $effect(() => {
    if (sentinel == null || !query.hasNextPage || query.isFetching) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) query.fetchNextPage()
    })
    observer.observe(sentinel)

    return () => observer.disconnect()
  })
</script>

{#if query.isPending}
  Loading...
{:else if query.isError}
  <span>Error: {query.error.message}</span>
{:else}
  <ul>
    {#each query.data.pages as page}
      {#each page.projects as project (project.id)}
        <li>{project.name}</li>
      {/each}
    {/each}
  </ul>
  <div bind:this={sentinel}></div>
{/if}
```
