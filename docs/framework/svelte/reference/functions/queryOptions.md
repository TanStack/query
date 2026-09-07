---
id: queryOptions
title: queryOptions
---

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/svelte-query/src/queryOptions.ts:68](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/queryOptions.ts#L68)

You can generally pass everything to `queryOptions` that you can also pass to `createQuery`. These options
can be shared across `createQuery` calls and imperative APIs such as `queryClient.query`. `options.queryKey`
is required and is the query key to generate options for.

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

[`DefinedInitialDataOptions`](../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [DefinedInitialDataOptions](../type-aliases/DefinedInitialDataOptions.md) to use — everything you can pass to `createQuery`,
with `initialData` set.

### Returns

[`CreateQueryOptions`](../type-aliases/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object` & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### See

[createQuery](createQuery.md) to run a query with these options.

### Example

```svelte
<script lang="ts">
  import { queryOptions, createQuery } from '@tanstack/svelte-query'

  const postsOptions = queryOptions({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    initialData: [],
  })

  // `data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
  // so the list stays visible alongside the error.
  const query = createQuery(() => postsOptions)
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
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/svelte-query/src/queryOptions.ts:113](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/queryOptions.ts#L113)

You can generally pass everything to `queryOptions` that you can also pass to `createQuery`. These options
can be shared across `createQuery` calls and imperative APIs such as `queryClient.query`. `options.queryKey`
is required and is the query key to generate options for.

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

[`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [UndefinedInitialDataOptions](../type-aliases/UndefinedInitialDataOptions.md) to use — everything you can pass to `createQuery`.

### Returns

[`CreateQueryOptions`](../type-aliases/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object` & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### See

[createQuery](createQuery.md) to run a query with these options.

### Example

A parameterized factory, so the same options object can be reused per `id`:
```svelte
<script lang="ts">
  import { queryOptions, createQuery } from '@tanstack/svelte-query'

  let { id }: { id: string } = $props()

  const postOptions = (id: string) =>
    queryOptions({
      queryKey: ['post', id],
      queryFn: () => fetchPost(id),
    })

  const query = createQuery(() => postOptions(id))
</script>

{#if query.isPending}
  Loading...
{:else if query.isError}
  <span>Error: {query.error.message}</span>
{:else}
  <h1>{query.data.title}</h1>
{/if}
```
