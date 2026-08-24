---
id: queryOptions
title: queryOptions
---

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [preact-query/src/queryOptions.ts:101](https://github.com/TanStack/query/blob/main/packages/preact-query/src/queryOptions.ts#L101)

You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
is the query key to generate options for.

This overload is selected when `initialData` is set, so `queryFn` is optional and the resulting `data` is
never `undefined`.

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

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

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
  const { data } = useQuery(postsOptions)
  return <>{data.map((post) => <p key={post.id}>{post.title}</p>)}</>
}
```

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): OmitKeyof<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [preact-query/src/queryOptions.ts:164](https://github.com/TanStack/query/blob/main/packages/preact-query/src/queryOptions.ts#L164)

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

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

### Examples

```tsx
import { queryOptions } from '@tanstack/preact-query'

export const postsOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})
```

A parameterized factory, reused across a hook and an imperative call with the same cache entry:
```tsx
import { queryOptions, useQuery } from '@tanstack/preact-query'

export const postOptions = (id: string) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

function Post({ id }: { id: string }) {
  const { data } = useQuery(postOptions(id))
  return <h1>{data?.title}</h1>
}

// Elsewhere, e.g. to warm the cache before rendering `<Post>`:
queryClient.prefetchQuery(postOptions(id))
```

The same options object works with every API that accepts query options:
```tsx
import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/preact-query'

const todosOptions = queryOptions({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})

useQuery(todosOptions)
useSuspenseQuery(todosOptions)
queryClient.prefetchQuery(todosOptions)
queryClient.getQueryData(todosOptions.queryKey) // typed as Array<Todo> | undefined
```

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [preact-query/src/queryOptions.ts:227](https://github.com/TanStack/query/blob/main/packages/preact-query/src/queryOptions.ts#L227)

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

### Returns

The same options object, typed so that `queryKey` carries the inferred data type.

### Examples

```tsx
import { queryOptions } from '@tanstack/preact-query'

export const postsOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})
```

A parameterized factory, reused across a hook and an imperative call with the same cache entry:
```tsx
import { queryOptions, useQuery } from '@tanstack/preact-query'

export const postOptions = (id: string) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

function Post({ id }: { id: string }) {
  const { data } = useQuery(postOptions(id))
  return <h1>{data?.title}</h1>
}

// Elsewhere, e.g. to warm the cache before rendering `<Post>`:
queryClient.prefetchQuery(postOptions(id))
```

The same options object works with every API that accepts query options:
```tsx
import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/preact-query'

const todosOptions = queryOptions({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})

useQuery(todosOptions)
useSuspenseQuery(todosOptions)
queryClient.prefetchQuery(todosOptions)
queryClient.getQueryData(todosOptions.queryKey) // typed as Array<Todo> | undefined
```
