---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

## Overview

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>;
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>;
```

- [`DefinedInitialDataInfiniteOptions` → `DefinedInitialDataInfiniteOptions & QueryKeyWithDataTag`](#call-signature-1): You can generally pass everything to `infiniteQueryOptions` that you can also pass to `createInfiniteQuery`. These options can be shared across `createInfiniteQuery` calls and imperative APIs such as `queryClient.infiniteQuery`. `options.queryKey` is required and is the query key to generate options for.
- [`UndefinedInitialDataInfiniteOptions` → `UndefinedInitialDataInfiniteOptions & QueryKeyWithDataTag`](#call-signature-2): You can generally pass everything to `infiniteQueryOptions` that you can also pass to `createInfiniteQuery`. These options can be shared across `createInfiniteQuery` calls and imperative APIs such as `queryClient.infiniteQuery`. `options.queryKey` is required and is the query key to generate options for.

See also: [Parameters](#parameters-summary) · [Returns](#returns-summary)

<a id="call-signature-1"></a>

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>;
```

Defined in: [packages/svelte-query/src/infiniteQueryOptions.ts:98](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/infiniteQueryOptions.ts#L98)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to `createInfiniteQuery`.
These options can be shared across `createInfiniteQuery` calls and imperative APIs such as
`queryClient.infiniteQuery`. `options.queryKey` is required and is the query key to generate options for.

This overload is selected when `initialData` is known to be defined.

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

[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [DefinedInitialDataInfiniteOptions](../type-aliases/DefinedInitialDataInfiniteOptions.md) to use — everything you can pass to
`createInfiniteQuery`, with `initialData` set.

### Returns

[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`\>, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### See

[createInfiniteQuery](createInfiniteQuery.md) to run an infinite query with these options.

### Example

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
  {#each query.data.pages as page}
    {#each page.projects as project (project.id)}
      <li>{project.name}</li>
    {/each}
  {/each}
</ul>
```

<a id="call-signature-2"></a>

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>;
```

Defined in: [packages/svelte-query/src/infiniteQueryOptions.ts:163](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/infiniteQueryOptions.ts#L163)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to `createInfiniteQuery`.
These options can be shared across `createInfiniteQuery` calls and imperative APIs such as
`queryClient.infiniteQuery`. `options.queryKey` is required and is the query key to generate options for.

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

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UndefinedInitialDataInfiniteOptions](../type-aliases/UndefinedInitialDataInfiniteOptions.md) to use — everything you can pass to
`createInfiniteQuery`.

### Returns

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`\>, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### See

[createInfiniteQuery](createInfiniteQuery.md) to run an infinite query with these options.

### Example

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

<a id="parameters-summary"></a>

## Parameters

### options

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UndefinedInitialDataInfiniteOptions](../type-aliases/UndefinedInitialDataInfiniteOptions.md) to use — everything you can pass to
`createInfiniteQuery`.

<a id="options-properties"></a>

#### `options` properties

Built from [`InfiniteQueryObserverOptions`](../interfaces/InfiniteQueryObserverOptions.md#properties). See the type above for what it changes.

<a id="returns-summary"></a>

## Returns

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`\>, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

<a id="result-properties"></a>

### Result properties

Built from [`InfiniteQueryObserverOptions`](../interfaces/InfiniteQueryObserverOptions.md#properties), [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md#properties). See the type above for what it changes.
