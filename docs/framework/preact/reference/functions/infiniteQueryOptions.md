---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:161](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L161)

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

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [DefinedInitialDataInfiniteOptions](../type-aliases/DefinedInitialDataInfiniteOptions.md) to use — everything you can pass to `useInfiniteQuery`, with `initialData` set.

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

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
  const { data } = useInfiniteQuery(projectsOptions)
  return (
    <ul>
      {data.pages.map((page) => page.projects.map((p) => <li key={p.id}>{p.name}</li>))}
    </ul>
  )
}
```

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): OmitKeyof<UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:249](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L249)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
`options.queryKey` is required and is the query key to generate options for.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`UnusedSkipTokenInfiniteOptions`](../type-aliases/UnusedSkipTokenInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UnusedSkipTokenInfiniteOptions](../type-aliases/UnusedSkipTokenInfiniteOptions.md) to use — everything you can pass to `useInfiniteQuery`.

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

### Examples

```tsx
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/preact-query'

export const projectsOptions = infiniteQueryOptions({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId,
})

function Projects() {
  const { data } = useInfiniteQuery(projectsOptions)
  return (
    <ul>
      {data?.pages.map((page) => page.projects.map((p) => <li key={p.id}>{p.name}</li>))}
    </ul>
  )
}
```

A parameterized factory, reused across a hook and an imperative call with the same cache entry:
```tsx
import {
  infiniteQueryOptions,
  noop,
  useInfiniteQuery,
} from '@tanstack/preact-query'

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

// `commentsOptions` also works with imperative APIs like `queryClient.infiniteQuery` —
// see `useInfiniteQuery` for an example that warms the cache this way before rendering `<Comments>`.
const postId = '1'
queryClient.infiniteQuery(commentsOptions(postId)).catch(noop)
```

### See

[useInfiniteQuery](useInfiniteQuery.md) to run an infinite query with these options.

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:372](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L372)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
`options.queryKey` is required and is the query key to generate options for.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UndefinedInitialDataInfiniteOptions](../type-aliases/UndefinedInitialDataInfiniteOptions.md) to use — everything you can pass to `useInfiniteQuery`.

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

### Examples

```tsx
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/preact-query'

export const projectsOptions = infiniteQueryOptions({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId,
})

function Projects() {
  const { data } = useInfiniteQuery(projectsOptions)
  return (
    <ul>
      {data?.pages.map((page) => page.projects.map((p) => <li key={p.id}>{p.name}</li>))}
    </ul>
  )
}
```

A parameterized factory, reused across a hook and an imperative call with the same cache entry:
```tsx
import {
  infiniteQueryOptions,
  noop,
  useInfiniteQuery,
} from '@tanstack/preact-query'

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

// `commentsOptions` also works with imperative APIs like `queryClient.infiniteQuery` —
// see `useInfiniteQuery` for an example that warms the cache this way before rendering `<Comments>`.
const postId = '1'
queryClient.infiniteQuery(commentsOptions(postId)).catch(noop)
```

A factory that disables the query, type safe, until `postId` is set:
```tsx
import {
  infiniteQueryOptions,
  skipToken,
  useInfiniteQuery,
} from '@tanstack/preact-query'

export const commentsOptions = (postId: string | undefined) =>
  infiniteQueryOptions({
    queryKey: ['post', postId, 'comments'],
    queryFn:
      postId != null
        ? ({ pageParam }) => fetchComments(postId, pageParam)
        : skipToken,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  })

function Comments({ postId }: { postId: string | undefined }) {
  const { data, isPending, isError, error } = useInfiniteQuery(commentsOptions(postId))

  if (postId == null) return 'Select a post'
  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <ul>
      {data.pages.map((page) => page.comments.map((c) => <li key={c.id}>{c.text}</li>))}
    </ul>
  )
}
```

### See

[useInfiniteQuery](useInfiniteQuery.md) to run an infinite query with these options.
