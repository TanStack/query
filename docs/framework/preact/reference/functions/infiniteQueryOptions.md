---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

## Overview

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>;
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: UnusedSkipTokenInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): UnusedSkipTokenInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>;
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>;
```

- [`DefinedInitialDataInfiniteOptions` → `DefinedInitialDataInfiniteOptions & QueryKeyWithDataTag`](#call-signature-1): You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`. These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`. `options.queryKey` is required and is the query key to generate options for.
- [`UnusedSkipTokenInfiniteOptions` → `UnusedSkipTokenInfiniteOptions & QueryKeyWithDataTag`](#call-signature-2): You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`. These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`. `options.queryKey` is required and is the query key to generate options for.
- [`UndefinedInitialDataInfiniteOptions` → `UndefinedInitialDataInfiniteOptions & QueryKeyWithDataTag`](#call-signature-3): You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`. These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`. `options.queryKey` is required and is the query key to generate options for.

See also: [Parameters](#parameters-summary) · [Returns](#returns-summary)

<a id="call-signature-1"></a>

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>;
```

Defined in: [packages/preact-query/src/infiniteQueryOptions.ts:166](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L166)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
`options.queryKey` is required and is the query key to generate options for.

This overload is selected when `initialData` is set.

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

The [DefinedInitialDataInfiniteOptions](../type-aliases/DefinedInitialDataInfiniteOptions.md) to use — everything you can pass to `useInfiniteQuery`, with `initialData` set.

### Returns

[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`\>, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### Remarks

See [useInfiniteQuery](useInfiniteQuery.md) for examples that fetch further pages, from a button click or
automatically as the user scrolls.

### See

[useInfiniteQuery](useInfiniteQuery.md) to run an infinite query with these options.

### Example

```tsx
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/preact-query'

export const projectsOptions = infiniteQueryOptions({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId,
  initialData: { pages: [], pageParams: [] },
})

function Projects() {
  // `data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
  // list stays visible alongside the error.
  const { data, isError, error } = useInfiniteQuery(projectsOptions)

  return (
    <div>
      {isError ? <span>Error: {error.message}</span> : null}
      <ul>
        {data.pages.map((page) => page.projects.map((p) => <li key={p.id}>{p.name}</li>))}
      </ul>
    </div>
  )
}
```

<a id="call-signature-2"></a>

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: UnusedSkipTokenInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): UnusedSkipTokenInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>;
```

Defined in: [packages/preact-query/src/infiniteQueryOptions.ts:225](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L225)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
`options.queryKey` is required and is the query key to generate options for.

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

[`UnusedSkipTokenInfiniteOptions`](../type-aliases/UnusedSkipTokenInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UnusedSkipTokenInfiniteOptions](../type-aliases/UnusedSkipTokenInfiniteOptions.md) to use — everything you can pass to `useInfiniteQuery`.

### Returns

[`UnusedSkipTokenInfiniteOptions`](../type-aliases/UnusedSkipTokenInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`\>, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### Remarks

See [useInfiniteQuery](useInfiniteQuery.md) for examples that fetch further pages, from a button click or
automatically as the user scrolls.

### See

[useInfiniteQuery](useInfiniteQuery.md) to run an infinite query with these options.

### Example

A parameterized factory, so the same options object can be reused per `postId`:
```tsx
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/preact-query'

export const commentsOptions = (postId: string) =>
  infiniteQueryOptions({
    queryKey: ['post', postId, 'comments'],
    queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  })

function Comments({ postId }: { postId: string }) {
  const { data, isPending, isError, error } = useInfiniteQuery(commentsOptions(postId))

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <ul>
      {data.pages.map((page) => page.comments.map((c) => <li key={c.id}>{c.text}</li>))}
    </ul>
  )
}
```

<a id="call-signature-3"></a>

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>;
```

Defined in: [packages/preact-query/src/infiniteQueryOptions.ts:284](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L284)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
`options.queryKey` is required and is the query key to generate options for.

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

The [UndefinedInitialDataInfiniteOptions](../type-aliases/UndefinedInitialDataInfiniteOptions.md) to use — everything you can pass to `useInfiniteQuery`.

### Returns

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`\>, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### Remarks

See [useInfiniteQuery](useInfiniteQuery.md) for examples that fetch further pages (from a button click or
automatically as the user scrolls) and that use `skipToken` to disable the query until `postId` is set.

### See

[useInfiniteQuery](useInfiniteQuery.md) to run an infinite query with these options.

### Example

A parameterized factory, so the same options object can be reused per `postId`:
```tsx
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/preact-query'

export const commentsOptions = (postId: string) =>
  infiniteQueryOptions({
    queryKey: ['post', postId, 'comments'],
    queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  })

function Comments({ postId }: { postId: string }) {
  const { data, isPending, isError, error } = useInfiniteQuery(commentsOptions(postId))

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <ul>
      {data.pages.map((page) => page.comments.map((c) => <li key={c.id}>{c.text}</li>))}
    </ul>
  )
}
```

<a id="parameters-summary"></a>

## Parameters

### options

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UndefinedInitialDataInfiniteOptions](../type-aliases/UndefinedInitialDataInfiniteOptions.md) to use — everything you can pass to `useInfiniteQuery`.

<a id="options-properties"></a>

#### `options` properties

Built from [`UseInfiniteQueryOptions`](../interfaces/UseInfiniteQueryOptions.md#properties). See the type above for what it changes.

<a id="returns-summary"></a>

## Returns

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`\>, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

<a id="result-properties"></a>

### Result properties

Built from [`UseInfiniteQueryOptions`](../interfaces/UseInfiniteQueryOptions.md#properties), [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md#properties). See the type above for what it changes.
