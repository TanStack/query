---
id: createQuery
title: createQuery
---

## Call Signature

```ts
function createQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): CreateQueryResult<TData, TError>;
```

Defined in: [packages/svelte-query/src/createQuery.ts:74](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createQuery.ts#L74)

### Type Parameters

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### options

[`Accessor`](../type-aliases/Accessor.md)\<[`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>\>

The [UndefinedInitialDataOptions](../type-aliases/UndefinedInitialDataOptions.md) to use — everything you can pass to `createQuery`,
wrapped in an [Accessor](../type-aliases/Accessor.md) so options can be reactive.

#### queryClient?

[`Accessor`](../type-aliases/Accessor.md)\<[`QueryClient`](../classes/QueryClient.md)\>

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`TData`, `TError`\>

The current query result. `status` is `pending` if there is no cached data to display, `error` if
the last fetch attempt failed, or `success` if the query has data to display. `isPending`/`isSuccess`/`isError`
are derived booleans for convenience.

### See

[queryOptions](queryOptions.md) to share these options between `createQuery` and imperative APIs like `queryClient.query`.

### Examples

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const query = createQuery(() => ({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  }))
</script>

{#if query.status === 'pending'}
  Loading...
{:else if query.status === 'error'}
  <span>Error: {query.error.message}</span>
{:else}
  <ul>
    {#each query.data as post (post.id)}
      <li>{post.title}</li>
    {/each}
  </ul>
{/if}
```

The same query, checking `isPending`/`isError` instead of `status` — pick whichever reads better to you:
```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const query = createQuery(() => ({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  }))
</script>

{#if query.isPending}
  Loading...
{:else if query.isError}
  <span>Error: {query.error.message}</span>
{:else}
  <ul>
    {#each query.data as post (post.id)}
      <li>{post.title}</li>
    {/each}
  </ul>
{/if}
```

## Call Signature

```ts
function createQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): DefinedCreateQueryResult<TData, TError>;
```

Defined in: [packages/svelte-query/src/createQuery.ts:122](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createQuery.ts#L122)

This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.

### Type Parameters

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### options

[`Accessor`](../type-aliases/Accessor.md)\<[`DefinedInitialDataOptions`](../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>\>

The [DefinedInitialDataOptions](../type-aliases/DefinedInitialDataOptions.md) to use — everything you can pass to `createQuery`,
with `initialData` set, wrapped in an [Accessor](../type-aliases/Accessor.md) so options can be reactive.

#### queryClient?

[`Accessor`](../type-aliases/Accessor.md)\<[`QueryClient`](../classes/QueryClient.md)\>

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`TData`, `TError`\>

The current query result, typed so that `status` is `success` — or `error` if a fetch attempt
fails while keeping the existing data (`status` never resolves to `pending` in this overload's type,
since `initialData` guarantees data upfront). `isSuccess`/`isError` are derived booleans for convenience.

### See

[queryOptions](queryOptions.md) to share these options between `createQuery` and imperative APIs like `queryClient.query`.

### Example

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  // `data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
  // so the list stays visible alongside the error.
  const query = createQuery(() => ({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    initialData: [],
  }))
</script>

{#if query.isError}
  <span>Error: {query.error.message}</span>
{/if}
<ul>
  {#each query.data as post (post.id)}
    <li>{post.title}</li>
  {/each}
</ul>
```

## Call Signature

```ts
function createQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): CreateQueryResult<TData, TError>;
```

Defined in: [packages/svelte-query/src/createQuery.ts:248](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createQuery.ts#L248)

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### options

[`Accessor`](../type-aliases/Accessor.md)\<[`CreateQueryOptions`](../type-aliases/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>\>

The [CreateQueryOptions](../type-aliases/CreateQueryOptions.md) to use — everything you can pass to `createQuery`, wrapped
in an [Accessor](../type-aliases/Accessor.md) so options can be reactive.

#### queryClient?

[`Accessor`](../type-aliases/Accessor.md)\<[`QueryClient`](../classes/QueryClient.md)\>

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`TData`, `TError`\>

The current query result. `status` is `pending` if there is no cached data to display, `error` if
the last fetch attempt failed, or `success` if the query has data to display. `isPending`/`isSuccess`/`isError`
are derived booleans for convenience.

### See

[queryOptions](queryOptions.md) to share these options between `createQuery` and imperative APIs like `queryClient.query`.

### Examples

`select` derives whatever `data` a component needs from the cached value, without changing what's
actually stored in the cache — the cache still holds the full `Post[]`, but `data` here is a `number`:
```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const query = createQuery(() => ({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    select: (posts) => posts.length,
  }))
</script>

{#if query.isPending}
  Loading...
{:else if query.isError}
  <span>Error: {query.error.message}</span>
{:else}
  <span>{query.data} posts</span>
{/if}
```

A dependent query, only enabled once `postId` is set — use `isLoading`, not `isPending`, so the
loading state doesn't show while the query is disabled:
```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  let { postId }: { postId: number | undefined } = $props()

  const query = createQuery(() => ({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId!),
    enabled: postId != null,
  }))
</script>

{#if postId == null}
  Select a post
{:else if query.isLoading}
  Loading...
{:else if query.isError}
  <span>Error: {query.error.message}</span>
{:else}
  <h1>{query.data?.title}</h1>
{/if}
```

Seeding a detail query from an already-cached list, to skip the loading state:
```svelte
<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'

  let { postId }: { postId: number } = $props()

  const queryClient = useQueryClient()

  const query = createQuery(() => ({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
    initialData: () =>
      queryClient
        .getQueryData<Array<Post>>(['posts'])
        ?.find((post) => post.id === postId),
  }))
</script>

{#if query.isError}
  <span>Error: {query.error.message}</span>
{/if}
<h1>{query.data?.title}</h1>
```

Paginated data, keeping the previous page's data visible while the next page loads:
```svelte
<script lang="ts">
  import { createQuery, keepPreviousData } from '@tanstack/svelte-query'

  let page = $state(0)

  const query = createQuery(() => ({
    queryKey: ['posts', page],
    queryFn: () => fetchPosts(page),
    placeholderData: keepPreviousData,
  }))
</script>

{#if query.isError}
  <span>Error: {query.error.message}</span>
{/if}
<ul>
  {#each query.data ?? [] as post (post.id)}
    <li>{post.title}</li>
  {/each}
</ul>
<button disabled={query.isPlaceholderData} onclick={() => page++}>
  Next Page
</button>
```
