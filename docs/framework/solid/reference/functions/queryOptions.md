---
id: queryOptions
title: queryOptions
redirect_from:
  - framework/solid/reference/queryOptions
---

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): QueryOptions<TQueryFnData, TError, TData, TQueryKey> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/solid-query/src/queryOptions.ts:89](https://github.com/TanStack/query/blob/main/packages/solid-query/src/queryOptions.ts#L89)

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

[`QueryOptions`](../interfaces/QueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object`

The [DefinedInitialDataOptions](../type-aliases/DefinedInitialDataOptions.md) to use — everything you can pass to `useQuery`, with `initialData` set.

### Returns

[`QueryOptions`](../interfaces/QueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object` & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### See

[useQuery](useQuery.md) to run a query with these options.

### Example

```tsx
import { For } from 'solid-js'
import { queryOptions, useQuery } from '@tanstack/solid-query'

const postsOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  initialData: [],
})

function Posts() {
  // `postsQuery.data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
  // so the list stays visible alongside the error.
  const postsQuery = useQuery(() => postsOptions)

  return (
    <div>
      {postsQuery.isError ? <span>Error: {postsQuery.error.message}</span> : null}
      <ul>
        <For each={postsQuery.data}>{(post) => <li>{post.title}</li>}</For>
      </ul>
    </div>
  )
}
```

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): QueryOptions<TQueryFnData, TError, TData, TQueryKey> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/solid-query/src/queryOptions.ts:139](https://github.com/TanStack/query/blob/main/packages/solid-query/src/queryOptions.ts#L139)

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

[`QueryOptions`](../interfaces/QueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object`

The [UndefinedInitialDataOptions](../type-aliases/UndefinedInitialDataOptions.md) to use — everything you can pass to `useQuery`.

### Returns

[`QueryOptions`](../interfaces/QueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object` & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### See

[useQuery](useQuery.md) to run a query with these options.

### Example

A parameterized factory, so the same options object can be reused per `id`:
```tsx
import { Match, Switch } from 'solid-js'
import { queryOptions, useQuery } from '@tanstack/solid-query'

const postOptions = (id: string) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

function Post(props: { id: string }) {
  const postQuery = useQuery(() => postOptions(props.id))

  return (
    <Switch>
      <Match when={postQuery.isPending}>Loading...</Match>
      <Match when={postQuery.isError}>Error: {postQuery.error.message}</Match>
      <Match when={postQuery.isSuccess}>
        <h1>{postQuery.data.title}</h1>
      </Match>
    </Switch>
  )
}
```
