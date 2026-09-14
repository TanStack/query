---
id: infiniteQueryOptions
title: infiniteQueryOptions
redirect_from:
  - framework/solid/reference/infiniteQueryOptions
---

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [packages/solid-query/src/infiniteQueryOptions.ts:105](https://github.com/TanStack/query/blob/main/packages/solid-query/src/infiniteQueryOptions.ts#L105)

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

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`InfiniteQueryOptions`](../interfaces/InfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object`

The [DefinedInitialDataInfiniteOptions](../type-aliases/DefinedInitialDataInfiniteOptions.md) to use — everything you can pass to `useInfiniteQuery`, with `initialData` set.

### Returns

[`InfiniteQueryOptions`](../interfaces/InfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object` & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### See

[useInfiniteQuery](useInfiniteQuery.md) to run an infinite query with these options.

### Example

```tsx
import { For } from 'solid-js'
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/solid-query'

const projectsOptions = infiniteQueryOptions({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId,
  initialData: { pages: [], pageParams: [] },
})

function Projects() {
  // `projectsQuery.data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
  // list stays visible alongside the error.
  const projectsQuery = useInfiniteQuery(() => projectsOptions)

  return (
    <div>
      {projectsQuery.isError ? <span>Error: {projectsQuery.error.message}</span> : null}
      <ul>
        <For each={projectsQuery.data.pages}>
          {(page) => <For each={page.projects}>{(p) => <li>{p.name}</li>}</For>}
        </For>
      </ul>
    </div>
  )
}
```

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [packages/solid-query/src/infiniteQueryOptions.ts:174](https://github.com/TanStack/query/blob/main/packages/solid-query/src/infiniteQueryOptions.ts#L174)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
`options.queryKey` is required and is the query key to generate options for.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`InfiniteQueryOptions`](../interfaces/InfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object`

The [UndefinedInitialDataInfiniteOptions](../type-aliases/UndefinedInitialDataInfiniteOptions.md) to use — everything you can pass to `useInfiniteQuery`.

### Returns

[`InfiniteQueryOptions`](../interfaces/InfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object` & [`QueryKeyWithDataTag`](../type-aliases/QueryKeyWithDataTag.md)\<`TQueryKey`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>, `TError`\>

The same options object, typed so that `queryKey` carries the inferred data type.

### See

[useInfiniteQuery](useInfiniteQuery.md) to run an infinite query with these options.

### Example

A parameterized factory, so the same options object can be reused per `postId`:
```tsx
import { For, Match, Switch } from 'solid-js'
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/solid-query'

const commentsOptions = (postId: string) =>
  infiniteQueryOptions({
    queryKey: ['post', postId, 'comments'],
    queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  })

function Comments(props: { postId: string }) {
  const commentsQuery = useInfiniteQuery(() => commentsOptions(props.postId))

  return (
    <Switch>
      <Match when={commentsQuery.isPending}>Loading...</Match>
      <Match when={commentsQuery.isError}>Error: {commentsQuery.error.message}</Match>
      <Match when={commentsQuery.isSuccess}>
        <ul>
          <For each={commentsQuery.data.pages}>
            {(page) => <For each={page.comments}>{(c) => <li>{c.text}</li>}</For>}
          </For>
        </ul>
      </Match>
    </Switch>
  )
}
```
