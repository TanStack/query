---
id: useQuery
title: useQuery
---

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): DefinedUseQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useQuery.ts:42](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L42)

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

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
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

  return <>{data.map((post) => <p key={post.id}>{post.title}</p>)}</>
}
```

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useQuery.ts:87](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L87)

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

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseQueryResult`](../type-aliases/UseQueryResult.md)\<`TData`, `TError`\>

The current query result. `status` is `pending` if there is no cached data and no query attempt
has finished yet, `error` if the query attempt resulted in an error, or `success` if the query has data to
display. `isPending`/`isSuccess`/`isError` are derived booleans for convenience.

### See

[queryOptions](queryOptions.md) to share these options between `useQuery` and imperative APIs like `queryClient.query`.

### Example

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
      {data.map((post) => (
        <p key={post.id}>{post.title}</p>
      ))}
      <div>{isFetching ? 'Background Updating...' : ' '}</div>
    </div>
  )
}
```

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useQuery.ts:169](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L169)

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

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
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
      {data.map((post) => (
        <p key={post.id}>{post.title}</p>
      ))}
      <div>{isFetching ? 'Background Updating...' : ' '}</div>
    </div>
  )
}
```

A dependent query, only enabled once `postId` is set:
```tsx
import { useQuery } from '@tanstack/preact-query'

function Post({ postId }: { postId: number | undefined }) {
  const { data } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId!),
    enabled: postId != null,
  })

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
