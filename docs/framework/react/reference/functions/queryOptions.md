---
id: queryOptions
title: queryOptions
redirect_from:
  - framework/react/reference/queryOptions
---

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/react-query/src/queryOptions.ts:142](https://github.com/TanStack/query/blob/main/packages/react-query/src/queryOptions.ts#L142)

You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
is the query key to generate options for.

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

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

### See

 - [useQuery](useQuery.md) to run a query with these options.
 - [The Query Options API](https://tkdodo.eu/blog/the-query-options-api) for more on this pattern.

### Example

```tsx
import { queryOptions, useQuery } from '@tanstack/react-query'

export const postsOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  initialData: [],
})

function Posts() {
  // `data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
  // so the list stays visible alongside the error.
  const { data, isError, error } = useQuery(postsOptions)

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
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): OmitKeyof<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/react-query/src/queryOptions.ts:183](https://github.com/TanStack/query/blob/main/packages/react-query/src/queryOptions.ts#L183)

You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
is the query key to generate options for.

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

[`UnusedSkipTokenOptions`](../type-aliases/UnusedSkipTokenOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [UnusedSkipTokenOptions](../type-aliases/UnusedSkipTokenOptions.md) to use — everything you can pass to `useQuery`.

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

### See

 - [useQuery](useQuery.md) to run a query with these options.
 - [The Query Options API](https://tkdodo.eu/blog/the-query-options-api) for more on this pattern.

### Example

A parameterized factory, so the same options object can be reused per `id`:
```tsx
import { queryOptions, useQuery } from '@tanstack/react-query'

export const postOptions = (id: string) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

function Post({ id }: { id: string }) {
  const { data, isPending, isError, error } = useQuery(postOptions(id))

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return <h1>{data.title}</h1>
}
```

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/react-query/src/queryOptions.ts:247](https://github.com/TanStack/query/blob/main/packages/react-query/src/queryOptions.ts#L247)

You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
is the query key to generate options for.

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

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

### See

 - [useQuery](useQuery.md) to run a query with these options.
 - [The Query Options API](https://tkdodo.eu/blog/the-query-options-api) for more on this pattern.

### Remarks

This is the only overload that accepts `queryFn: skipToken`, shown below.

### Examples

A parameterized factory, so the same options object can be reused per `id`:
```tsx
import { queryOptions, useQuery } from '@tanstack/react-query'

export const postOptions = (id: string) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

function Post({ id }: { id: string }) {
  const { data, isPending, isError, error } = useQuery(postOptions(id))

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return <h1>{data.title}</h1>
}
```

A factory that disables the query, type safe, until `postId` is set:
```tsx
import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'

export const postOptions = (postId: number | undefined) =>
  queryOptions({
    queryKey: ['post', postId],
    queryFn: postId != null ? () => fetchPost(postId) : skipToken,
  })

function Post({ postId }: { postId: number | undefined }) {
  const { data, isLoading, isError, error } = useQuery(postOptions(postId))

  if (postId == null) return 'Select a post'
  if (isLoading) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return <h1>{data?.title}</h1>
}
```
