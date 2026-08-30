---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:174](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L174)

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
  // `data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
  // list stays visible alongside the error.
  const { data, isError, error, fetchNextPage, hasNextPage } =
    useInfiniteQuery(projectsOptions)

  return (
    <div>
      {isError ? <span>Error: {error.message}</span> : null}
      <ul>
        {data.pages.map((page) => page.projects.map((p) => <li key={p.id}>{p.name}</li>))}
      </ul>
      {hasNextPage ? (
        <button onClick={() => fetchNextPage()}>Load More</button>
      ) : null}
    </div>
  )
}
```

See [useInfiniteQuery](useInfiniteQuery.md) for an example that fetches the next page automatically as the
user scrolls, instead of on a button click.

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): OmitKeyof<UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:275](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L275)

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
  const { data, isPending, isError, error, fetchNextPage, hasNextPage } =
    useInfiniteQuery(projectsOptions)

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <div>
      <ul>
        {data.pages.map((page) => page.projects.map((p) => <li key={p.id}>{p.name}</li>))}
      </ul>
      {hasNextPage ? (
        <button onClick={() => fetchNextPage()}>Load More</button>
      ) : null}
    </div>
  )
}
```

See [useInfiniteQuery](useInfiniteQuery.md) for an example that fetches the next page automatically as the
user scrolls, instead of on a button click.

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

Defined in: [preact-query/src/infiniteQueryOptions.ts:412](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L412)

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
  const { data, isPending, isError, error, fetchNextPage, hasNextPage } =
    useInfiniteQuery(projectsOptions)

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <div>
      <ul>
        {data.pages.map((page) => page.projects.map((p) => <li key={p.id}>{p.name}</li>))}
      </ul>
      {hasNextPage ? (
        <button onClick={() => fetchNextPage()}>Load More</button>
      ) : null}
    </div>
  )
}
```

See [useInfiniteQuery](useInfiniteQuery.md) for an example that fetches the next page automatically as the
user scrolls, instead of on a button click.

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
  // Use `isLoading`, not `isPending`, so the loading state doesn't show while the query is disabled.
  const { data, isLoading, isError, error } = useInfiniteQuery(commentsOptions(postId))

  if (postId == null) return 'Select a post'
  if (isLoading) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <ul>
      {data?.pages.map((page) => page.comments.map((c) => <li key={c.id}>{c.text}</li>))}
    </ul>
  )
}
```

### See

[useInfiniteQuery](useInfiniteQuery.md) to run an infinite query with these options.
