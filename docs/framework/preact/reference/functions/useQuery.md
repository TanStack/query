---
id: useQuery
title: useQuery
---

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): DefinedUseQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useQuery.ts:19](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L19)

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

#### queryClient?

`QueryClient`

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
be used.

### Returns

[`DefinedUseQueryResult`](../type-aliases/DefinedUseQueryResult.md)\<`TData`, `TError`\>

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useQuery.ts:33](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L33)

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

#### queryClient?

`QueryClient`

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseQueryResult`](../type-aliases/UseQueryResult.md)\<`TData`, `TError`\>

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useQuery.ts:89](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L89)

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

#### queryClient?

`QueryClient`

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseQueryResult`](../type-aliases/UseQueryResult.md)\<`TData`, `TError`\>

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

function Post({ postId }: { postId: number }) {
  const { data } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
    enabled: !!postId,
  })

  return <h1>{data?.title}</h1>
}
```
