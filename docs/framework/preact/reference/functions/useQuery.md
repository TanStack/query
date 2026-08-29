---
id: useQuery
title: useQuery
---

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): DefinedUseQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useQuery.ts:46](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L46)

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

`QueryClient`

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
  // `data` is `Post[]`, never `undefined`, thanks to `initialData`.
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    initialData: [],
  })

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

Defined in: [preact-query/src/useQuery.ts:115](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L115)

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

`QueryClient`

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseQueryResult`](../type-aliases/UseQueryResult.md)\<`TData`, `TError`\>

The current query result. `status` is `pending` if there is no cached data and no query attempt
has finished yet, `error` if the query attempt resulted in an error, or `success` if the query has data to
display. `isPending`/`isSuccess`/`isError` are derived booleans for convenience.

### See

[queryOptions](queryOptions.md) to share these options between `useQuery` and imperative APIs like `queryClient.query`.

### Examples

```tsx
import { queryOptions, useQuery } from '@tanstack/preact-query'

const postsOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

function Posts() {
  const { status, data, error, isFetching } = useQuery(postsOptions)

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

Defined in: [preact-query/src/useQuery.ts:288](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L288)

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

`QueryClient`

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseQueryResult`](../type-aliases/UseQueryResult.md)\<`TData`, `TError`\>

The current query result. `status` is `pending` if there is no cached data and no query attempt
has finished yet, `error` if the query attempt resulted in an error, or `success` if the query has data to
display. `isPending`/`isSuccess`/`isError` are derived booleans for convenience.

### See

[queryOptions](queryOptions.md) to share these options between `useQuery` and imperative APIs like `queryClient.query`.

### Examples

```tsx
import { queryOptions, useQuery } from '@tanstack/preact-query'

const postsOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

function Posts() {
  const { status, data, error, isFetching } = useQuery(postsOptions)

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

  const { data } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
    initialData: () =>
      queryClient
        .getQueryData<Array<Post>>(['posts'])
        ?.find((post) => post.id === postId),
  })

  return <h1>{data?.title}</h1>
}
```

Paginated data, keeping the previous page's data visible while the next page loads:
```tsx
import { keepPreviousData, useQuery } from '@tanstack/preact-query'
import { useState } from 'preact/hooks'

function Posts() {
  const [page, setPage] = useState(0)

  const { data, isPlaceholderData } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => fetchPosts(page),
    placeholderData: keepPreviousData,
  })

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

Warming the cache on hover, so `<Post>` has data as soon as it's clicked. Requires a
[queryOptions](queryOptions.md) factory, so the hook and the imperative call share the same cache entry:
```tsx
import { noop, queryOptions, useQuery, useQueryClient } from '@tanstack/preact-query'

const postOptions = (id: string) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

function Post({ id }: { id: string }) {
  const { data } = useQuery(postOptions(id))
  return <h1>{data?.title}</h1>
}

function PostLink({ id, title }: { id: string; title: string }) {
  const queryClient = useQueryClient()

  return (
    <a
      href={`/posts/${id}`}
      onMouseEnter={() => queryClient.query(postOptions(id)).catch(noop)}
    >
      {title}
    </a>
  )
}
```
