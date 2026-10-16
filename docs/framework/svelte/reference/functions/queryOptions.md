---
id: queryOptions
title: queryOptions
---

## Overview

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

- [`DefinedInitialDataOptions` → `DefinedInitialDataOptions & QueryKeyWithDataTag`](#call-signature-1): You can generally pass everything to `queryOptions` that you can also pass to `createQuery`. These options can be shared across `createQuery` calls and imperative APIs such as `queryClient.query`. `options.queryKey` is required and is the query key to generate options for.
- [`UndefinedInitialDataOptions` → `UndefinedInitialDataOptions & QueryKeyWithDataTag`](#call-signature-2): You can generally pass everything to `queryOptions` that you can also pass to `createQuery`. These options can be shared across `createQuery` calls and imperative APIs such as `queryClient.query`. `options.queryKey` is required and is the query key to generate options for.

See also: [Parameters](#parameters-summary) · [Returns](#returns-summary)

<a id="call-signature-1"></a>

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/svelte-query/src/queryOptions.ts:78](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/queryOptions.ts#L78)

You can generally pass everything to `queryOptions` that you can also pass to `createQuery`. These options
can be shared across `createQuery` calls and imperative APIs such as `queryClient.query`. `options.queryKey`
is required and is the query key to generate options for.

This overload is selected when `initialData` is set, so the resulting `data` is never `undefined` (unless
a `select` changes `TData` to include `undefined`).

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

[`DefinedInitialDataOptions`](../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>

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

<a id="call-signature-2"></a>

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/svelte-query/src/queryOptions.ts:121](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/queryOptions.ts#L121)

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

[`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>

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

<a id="parameters-summary"></a>

## Parameters

### options

[`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [UndefinedInitialDataOptions](../type-aliases/UndefinedInitialDataOptions.md) to use — everything you can pass to `createQuery`.

<a id="options-properties"></a>

#### `options` properties

Built from [`QueryObserverOptions`](../interfaces/QueryObserverOptions.md#properties). See the type above for what it changes.

<a id="returns-summary"></a>

## Returns

[`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

<a id="result-properties"></a>

### Result properties

Built from [`QueryObserverOptions`](../interfaces/QueryObserverOptions.md#properties), [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md#properties). See the type above for what it changes.
