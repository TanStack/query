---
id: createInfiniteQuery
title: createInfiniteQuery
---

```ts
const createInfiniteQuery: {
<TQueryFnData, TError, TData, TQueryKey, TPageParam>  (options, queryClient?): DefinedUseInfiniteQueryResult<TData, TError>;
<TQueryFnData, TError, TData, TQueryKey, TPageParam>  (options, queryClient?): UseInfiniteQueryResult<TData, TError>;
} = useInfiniteQuery;
```

Defined in: [packages/solid-query/src/index.ts:72](https://github.com/TanStack/query/blob/main/packages/solid-query/src/index.ts#L72)

## Call Signature

```ts
<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): DefinedUseInfiniteQueryResult<TData, TError>;
```

The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of
`initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

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

[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

An accessor returning the [DefinedInitialDataInfiniteOptions](../type-aliases/DefinedInitialDataInfiniteOptions.md) to use — everything you
can pass to `useInfiniteQuery`, with `initialData` set.

#### queryClient?

`Accessor`\<[`QueryClient`](../classes/QueryClient.md)\>

An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
will be used.

### Returns

[`DefinedUseInfiniteQueryResult`](../type-aliases/DefinedUseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
`hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.pages` and
`data.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
`InfiniteData<TQueryFnData>` shape.

### Remarks

Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
actions, or add conditions like `hasNextPage && !isFetching`.

### See

[infiniteQueryOptions](../functions/infiniteQueryOptions.md) to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.

### Example

```tsx
import { For } from 'solid-js'
import { useInfiniteQuery } from '@tanstack/solid-query'

function Projects() {
  // `projectsQuery.data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
  // list stays visible alongside the error.
  const projectsQuery = useInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
    initialData: { pages: [], pageParams: [] },
  }))

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
<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): UseInfiniteQueryResult<TData, TError>;
```

The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of
`initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

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

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

An accessor returning the [UndefinedInitialDataInfiniteOptions](../type-aliases/UndefinedInitialDataInfiniteOptions.md) to use — everything
you can pass to `useInfiniteQuery`.

#### queryClient?

`Accessor`\<[`QueryClient`](../classes/QueryClient.md)\>

An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
will be used.

### Returns

[`UseInfiniteQueryResult`](../type-aliases/UseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
`hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.pages` and
`data.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
`InfiniteData<TQueryFnData>` shape.

### Remarks

Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
actions, or add conditions like `hasNextPage && !isFetching`.

### See

[infiniteQueryOptions](../functions/infiniteQueryOptions.md) to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.

### Examples

Fetching the next page from a "Load More" button click:
```tsx
import { For, Match, Switch } from 'solid-js'
import { useInfiniteQuery } from '@tanstack/solid-query'

function Projects() {
  const projectsQuery = useInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  }))

  return (
    <Switch>
      <Match when={projectsQuery.isPending}>Loading...</Match>
      <Match when={projectsQuery.isError}>Error: {projectsQuery.error.message}</Match>
      <Match when={projectsQuery.isSuccess}>
        <ul>
          <For each={projectsQuery.data.pages}>
            {(page) => <For each={page.projects}>{(p) => <li>{p.name}</li>}</For>}
          </For>
        </ul>
        <button
          onClick={() => projectsQuery.fetchNextPage()}
          disabled={!projectsQuery.hasNextPage || projectsQuery.isFetching}
        >
          {projectsQuery.isFetchingNextPage
            ? 'Loading more...'
            : projectsQuery.hasNextPage
              ? 'Load More'
              : 'Nothing more to load'}
        </button>
      </Match>
    </Switch>
  )
}
```

Fetching the next page automatically as the user scrolls, using an `IntersectionObserver` on a
sentinel element after the list:
```tsx
import { For, Match, Switch, createEffect, onCleanup } from 'solid-js'
import { useInfiniteQuery } from '@tanstack/solid-query'

function Projects() {
  const projectsQuery = useInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  }))

  let sentinelRef: HTMLDivElement | undefined

  createEffect(() => {
    if (sentinelRef == null || !projectsQuery.hasNextPage || projectsQuery.isFetching) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) projectsQuery.fetchNextPage()
    })
    observer.observe(sentinelRef)

    onCleanup(() => observer.disconnect())
  })

  return (
    <Switch>
      <Match when={projectsQuery.isPending}>Loading...</Match>
      <Match when={projectsQuery.isError}>Error: {projectsQuery.error.message}</Match>
      <Match when={projectsQuery.isSuccess}>
        <ul>
          <For each={projectsQuery.data.pages}>
            {(page) => <For each={page.projects}>{(p) => <li>{p.name}</li>}</For>}
          </For>
        </ul>
        <div ref={sentinelRef}>{projectsQuery.isFetchingNextPage ? 'Loading more...' : null}</div>
      </Match>
    </Switch>
  )
}
```
