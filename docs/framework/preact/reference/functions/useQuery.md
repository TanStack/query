---
id: useQuery
title: useQuery
---

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): DefinedUseQueryResult<TData, TError>;
```

Defined in: [packages/preact-query/src/useQuery.ts:50](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L50)

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

The [DefinedInitialDataOptions](../type-aliases/DefinedInitialDataOptions.md) to use — everything you can pass to `useQuery`, with `initialData` set.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`DefinedUseQueryResult`](../type-aliases/DefinedUseQueryResult.md)\<`TData`, `TError`\>

The current query result, typed so that `status` is `success` — or `error` if a fetch attempt
fails while keeping the existing data (`status` never resolves to `pending` in this overload's type,
since `initialData` guarantees data upfront). `isSuccess`/`isError` are derived booleans for convenience.

### See

[queryOptions](queryOptions.md) to share these options between `useQuery` and imperative APIs like `queryClient.query`.

### Example

```tsx
import { useQuery } from '@tanstack/preact-query'

function Posts() {
  // `data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
  // so the list stays visible alongside the error.
  const { data, isError, error } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    initialData: [],
  })

  return (
    <div>
      {isError ? <span>Error: {error.message}</span> : null}
      <ul>
        {data.map((post) => <li key={post.id}>{post.title}</li>)}
      </ul>
    </div>
  )
}
```

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseQueryResult<TData, TError>;
```

Defined in: [packages/preact-query/src/useQuery.ts:117](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L117)

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

The [UndefinedInitialDataOptions](../type-aliases/UndefinedInitialDataOptions.md) to use — everything you can pass to `useQuery`.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseQueryResult`](../type-aliases/UseQueryResult.md)\<`TData`, `TError`\>

The current query result. `status` is `pending` if there is no cached data to display, `error` if
the last fetch attempt failed, or `success` if the query has data to display. `isPending`/`isSuccess`/`isError`
are derived booleans for convenience.

### See

[queryOptions](queryOptions.md) to share these options between `useQuery` and imperative APIs like `queryClient.query`.

### Examples

```tsx
import { useQuery } from '@tanstack/preact-query'

function Posts() {
  const { status, data, error, isFetching } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  if (status === 'pending') return 'Loading...'
  if (status === 'error') return <span>Error: {error.message}</span>

  return (
    <div>
      <ul>
        {data.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
      <div>{isFetching ? 'Background Updating...' : ' '}</div>
    </div>
  )
}
```

The same query, checking `isPending`/`isError` instead of `status` — pick whichever reads better to you:
```tsx
import { useQuery } from '@tanstack/preact-query'

function Posts() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <ul>
      {data.map((post) => <li key={post.id}>{post.title}</li>)}
    </ul>
  )
}
```

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseQueryResult<TData, TError>;
```

Defined in: [packages/preact-query/src/useQuery.ts:281](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L281)

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

[`UseQueryOptions`](../interfaces/UseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [UseQueryOptions](../interfaces/UseQueryOptions.md) to use — everything you can pass to `useQuery`.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseQueryResult`](../type-aliases/UseQueryResult.md)\<`TData`, `TError`\>

The current query result. `status` is `pending` if there is no cached data to display, `error` if
the last fetch attempt failed, or `success` if the query has data to display. `isPending`/`isSuccess`/`isError`
are derived booleans for convenience.

### See

[queryOptions](queryOptions.md) to share these options between `useQuery` and imperative APIs like `queryClient.query`.

### Examples

```tsx
import { useQuery } from '@tanstack/preact-query'

function Posts() {
  const { status, data, error, isFetching } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  if (status === 'pending') return 'Loading...'
  if (status === 'error') return <span>Error: {error.message}</span>

  return (
    <div>
      <ul>
        {data.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
      <div>{isFetching ? 'Background Updating...' : ' '}</div>
    </div>
  )
}
```

`select` derives whatever `data` a component needs from the cached value, without changing what's
actually stored in the cache — the cache still holds the full `Post[]`, but `data` here is a `number`:
```tsx
import { useQuery } from '@tanstack/preact-query'

function PostCount() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    select: (posts) => posts.length,
  })

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return <span>{data} posts</span>
}
```

A dependent query, only enabled once `postId` is set — use `isLoading`, not `isPending`, so the
loading state doesn't show while the query is disabled:
```tsx
import { useQuery } from '@tanstack/preact-query'

function Post({ postId }: { postId: number | undefined }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId!),
    enabled: postId != null,
  })

  if (postId == null) return 'Select a post'
  if (isLoading) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return <h1>{data?.title}</h1>
}
```

The same dependent query, type safe: `skipToken` disables the query without needing the
non-null assertion above, since `queryFn` is only ever called when `postId` is defined.
`refetch` doesn't work while `queryFn` is `skipToken` — use `enabled: false` instead if you
need to trigger the query manually:
```tsx
import { skipToken, useQuery } from '@tanstack/preact-query'

function Post({ postId }: { postId: number | undefined }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: postId != null ? () => fetchPost(postId) : skipToken,
  })

  if (postId == null) return 'Select a post'
  if (isLoading) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return <h1>{data?.title}</h1>
}
```

Seeding a detail query from an already-cached list, to skip the loading state:
```tsx
import { useQuery, useQueryClient } from '@tanstack/preact-query'

function Post({ postId }: { postId: number }) {
  const queryClient = useQueryClient()

  const { data, isError, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
    initialData: () =>
      queryClient
        .getQueryData<Array<Post>>(['posts'])
        ?.find((post) => post.id === postId),
  })

  if (isError) return <span>Error: {error.message}</span>

  return <h1>{data?.title}</h1>
}
```

Paginated data, keeping the previous page's data visible while the next page loads:
```tsx
import { keepPreviousData, useQuery } from '@tanstack/preact-query'
import { useState } from 'preact/hooks'

function Posts() {
  const [page, setPage] = useState(0)

  const { data, isPlaceholderData, isError, error } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => fetchPosts(page),
    placeholderData: keepPreviousData,
  })

  if (isError) return <span>Error: {error.message}</span>

  return (
    <div>
      <ul>
        {data?.map((post) => <li key={post.id}>{post.title}</li>)}
      </ul>
      <button
        disabled={isPlaceholderData}
        onClick={() => setPage((old) => old + 1)}
      >
        Next Page
      </button>
    </div>
  )
}
```
