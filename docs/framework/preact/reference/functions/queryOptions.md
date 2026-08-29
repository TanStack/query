---
id: queryOptions
title: queryOptions
---

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [preact-query/src/queryOptions.ts:138](https://github.com/TanStack/query/blob/main/packages/preact-query/src/queryOptions.ts#L138)

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

[useQuery](useQuery.md) to run a query with these options.

### Example

```tsx
import { queryOptions, useQuery } from '@tanstack/preact-query'

export const postsOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  initialData: [],
})

function Posts() {
  // `data` is `Post[]`, never `undefined`, thanks to `initialData`.
  const { data, isError, error } = useQuery(postsOptions)

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
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): OmitKeyof<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [preact-query/src/queryOptions.ts:232](https://github.com/TanStack/query/blob/main/packages/preact-query/src/queryOptions.ts#L232)

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

[useQuery](useQuery.md) to run a query with these options.

### Examples

```tsx
import { queryOptions, useQuery } from '@tanstack/preact-query'

export const postsOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

function Posts() {
  const { data, isPending, isError, error } = useQuery(postsOptions)

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <ul>
      {data.map((post) => <li key={post.id}>{post.title}</li>)}
    </ul>
  )
}
```

A parameterized factory, reused across a hook and an imperative call with the same cache entry:
```tsx
import { noop, queryOptions, useQuery } from '@tanstack/preact-query'

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

// `postOptions` also works with imperative APIs like `queryClient.query` —
// see `useQuery` for an example that warms the cache this way before rendering `<Post>`.
const postId = '1'
queryClient.query(postOptions(postId)).catch(noop)
```

The same options object works with every API that accepts query options:
```tsx
import { noop, queryOptions, useQuery } from '@tanstack/preact-query'

const todosOptions = queryOptions({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})

function Todos() {
  const { data, isPending, isError, error } = useQuery(todosOptions)

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <ul>
      {data.map((todo) => <li key={todo.id}>{todo.title}</li>)}
    </ul>
  )
}

// The same options object works with the imperative APIs too:
queryClient.query(todosOptions).catch(noop)
queryClient.getQueryData(todosOptions.queryKey) // typed as Array<Todo> | undefined
```

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [preact-query/src/queryOptions.ts:348](https://github.com/TanStack/query/blob/main/packages/preact-query/src/queryOptions.ts#L348)

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

[useQuery](useQuery.md) to run a query with these options.

### Examples

```tsx
import { queryOptions, useQuery } from '@tanstack/preact-query'

export const postsOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

function Posts() {
  const { data, isPending, isError, error } = useQuery(postsOptions)

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <ul>
      {data.map((post) => <li key={post.id}>{post.title}</li>)}
    </ul>
  )
}
```

A parameterized factory, reused across a hook and an imperative call with the same cache entry:
```tsx
import { noop, queryOptions, useQuery } from '@tanstack/preact-query'

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

// `postOptions` also works with imperative APIs like `queryClient.query` —
// see `useQuery` for an example that warms the cache this way before rendering `<Post>`.
const postId = '1'
queryClient.query(postOptions(postId)).catch(noop)
```

The same options object works with every API that accepts query options:
```tsx
import { noop, queryOptions, useQuery } from '@tanstack/preact-query'

const todosOptions = queryOptions({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})

function Todos() {
  const { data, isPending, isError, error } = useQuery(todosOptions)

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <ul>
      {data.map((todo) => <li key={todo.id}>{todo.title}</li>)}
    </ul>
  )
}

// The same options object works with the imperative APIs too:
queryClient.query(todosOptions).catch(noop)
queryClient.getQueryData(todosOptions.queryKey) // typed as Array<Todo> | undefined
```

A factory that disables the query, type safe, until `postId` is set:
```tsx
import { queryOptions, skipToken, useQuery } from '@tanstack/preact-query'

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
