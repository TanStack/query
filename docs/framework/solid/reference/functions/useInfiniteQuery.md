---
id: useInfiniteQuery
title: useInfiniteQuery
redirect_from:
  - framework/solid/reference/useInfiniteQuery
---

## Overview

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, queryClient?: Accessor<QueryClient>): DefinedUseInfiniteQueryResult<TData, TError>;
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, queryClient?: Accessor<QueryClient>): UseInfiniteQueryResult<TData, TError>;
```

- [`DefinedInitialDataInfiniteOptions` → `DefinedUseInfiniteQueryResult`](#call-signature-1): The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.
- [`UndefinedInitialDataInfiniteOptions` → `UseInfiniteQueryResult`](#call-signature-2): The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

See also: [Parameters](#parameters-summary) · [Returns](#returns-summary)

<a id="call-signature-1"></a>

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, queryClient?: Accessor<QueryClient>): DefinedUseInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/solid-query/src/useInfiniteQuery.ts:68](https://github.com/TanStack/query/blob/main/packages/solid-query/src/useInfiniteQuery.ts#L68)

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

[infiniteQueryOptions](infiniteQueryOptions.md) to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.

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

<a id="call-signature-2"></a>

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, queryClient?: Accessor<QueryClient>): UseInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/solid-query/src/useInfiniteQuery.ts:184](https://github.com/TanStack/query/blob/main/packages/solid-query/src/useInfiniteQuery.ts#L184)

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

[infiniteQueryOptions](infiniteQueryOptions.md) to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.

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

<a id="parameters-summary"></a>

## Parameters

### options

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

An accessor returning the [UndefinedInitialDataInfiniteOptions](../type-aliases/UndefinedInitialDataInfiniteOptions.md) to use — everything
you can pass to `useInfiniteQuery`.

<a id="options-properties"></a>

#### `options` properties

Built from [`InfiniteQueryOptions`](../interfaces/InfiniteQueryOptions.md#properties). See the type above for what it changes.

### queryClient?

`Accessor`\<[`QueryClient`](../classes/QueryClient.md)\>

An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
will be used.

<a id="returns-summary"></a>

## Returns

[`UseInfiniteQueryResult`](../type-aliases/UseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
`hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.pages` and
`data.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
`InfiniteData<TQueryFnData>` shape.

<a id="result-properties"></a>

### Result properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="result-property-data"></a> `data` | `TData` \| `undefined` | The last successfully resolved data for the query. |
| <a id="result-property-dataupdatedat"></a> `dataUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"success"`. |
| <a id="result-property-error"></a> `error` | `TError` \| `null` | The error object for the query, if an error was thrown. - Defaults to `null`. |
| <a id="result-property-errorupdatecount"></a> `errorUpdateCount` | `number` | The sum of all errors. |
| <a id="result-property-errorupdatedat"></a> `errorUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"error"`. |
| <a id="result-property-failurecount"></a> `failureCount` | `number` | The failure count for the query. - Incremented every time the query fails. - Reset to `0` when the query succeeds. |
| <a id="result-property-failurereason"></a> `failureReason` | `TError` \| `null` | The failure reason for the query retry. - Reset to `null` when the query succeeds. |
| <a id="result-property-fetchnextpage"></a> `fetchNextPage` | (`options?`: [`FetchNextPageOptions`](../interfaces/FetchNextPageOptions.md)) => `Promise`\<[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>\> | This function allows you to fetch the next "page" of results. |
| <a id="result-property-fetchpreviouspage"></a> `fetchPreviousPage` | (`options?`: [`FetchPreviousPageOptions`](../interfaces/FetchPreviousPageOptions.md)) => `Promise`\<[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>\> | This function allows you to fetch the previous "page" of results. |
| <a id="result-property-fetchstatus"></a> `fetchStatus` | `"fetching"` \| `"paused"` \| `"idle"` | The fetch status of the query. - `fetching`: Is `true` whenever the queryFn is executing, which includes initial `pending` as well as background refetch. - `paused`: The query wanted to fetch, but has been `paused`. - `idle`: The query is not fetching. - See [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. |
| <a id="result-property-hasnextpage"></a> `hasNextPage` | `boolean` | Will be `true` if there is a next page to be fetched (known via the `getNextPageParam` option). |
| <a id="result-property-haspreviouspage"></a> `hasPreviousPage` | `boolean` | Will be `true` if there is a previous page to be fetched (known via the `getPreviousPageParam` option). |
| <a id="result-property-isenabled"></a> `isEnabled` | `boolean` | `true` if this observer is enabled, `false` otherwise. |
| <a id="result-property-iserror"></a> `isError` | `boolean` | A derived boolean from the `status` variable, provided for convenience. - `true` if the query attempt resulted in an error. |
| <a id="result-property-isfetched"></a> `isFetched` | `boolean` | Will be `true` if the query has been fetched. |
| <a id="result-property-isfetchedaftermount"></a> `isFetchedAfterMount` | `boolean` | Will be `true` if the query has been fetched after the component mounted. - This property can be used to not show any previously cached data. |
| <a id="result-property-isfetching"></a> `isFetching` | `boolean` | A derived boolean from the `fetchStatus` variable, provided for convenience. - `true` whenever the `queryFn` is executing, which includes initial `pending` as well as background refetch. |
| <a id="result-property-isfetchingnextpage"></a> `isFetchingNextPage` | `boolean` | Will be `true` while fetching the next page with `fetchNextPage`. |
| <a id="result-property-isfetchingpreviouspage"></a> `isFetchingPreviousPage` | `boolean` | Will be `true` while fetching the previous page with `fetchPreviousPage`. |
| <a id="result-property-isfetchnextpageerror"></a> `isFetchNextPageError` | `boolean` | Will be `true` if the query failed while fetching the next page. |
| <a id="result-property-isfetchpreviouspageerror"></a> `isFetchPreviousPageError` | `boolean` | Will be `true` if the query failed while fetching the previous page. |
| <a id="result-property-isinitialloading"></a> ~~`isInitialLoading`~~ | `boolean` | **Deprecated** `isInitialLoading` is being deprecated in favor of `isLoading` and will be removed in the next major version. |
| <a id="result-property-isloading"></a> `isLoading` | `boolean` | Is `true` whenever the first fetch for a query is in-flight. - Is the same as `isFetching && isPending`. |
| <a id="result-property-isloadingerror"></a> `isLoadingError` | `boolean` | Will be `true` if the query failed while fetching for the first time. |
| <a id="result-property-ispaused"></a> `isPaused` | `boolean` | A derived boolean from the `fetchStatus` variable, provided for convenience. - The query wanted to fetch, but has been `paused`. |
| <a id="result-property-ispending"></a> `isPending` | `boolean` | Will be `pending` if there's no cached data and no query attempt was finished yet. |
| <a id="result-property-isplaceholderdata"></a> `isPlaceholderData` | `boolean` | Will be `true` if the data shown is the placeholder data. |
| <a id="result-property-isrefetcherror"></a> `isRefetchError` | `boolean` | Will be `true` if the query failed while refetching. |
| <a id="result-property-isrefetching"></a> `isRefetching` | `boolean` | Is `true` whenever a background refetch is in-flight, which _does not_ include initial `pending`. - Is the same as `isFetching && !isPending`. |
| <a id="result-property-isstale"></a> `isStale` | `boolean` | Will be `true` if the data in the cache is invalidated or if the data is older than the given `staleTime`. |
| <a id="result-property-issuccess"></a> `isSuccess` | `boolean` | A derived boolean from the `status` variable, provided for convenience. - `true` if the query has received a response with no errors and is ready to display its data. |
| <a id="result-property-refetch"></a> `refetch` | (`options?`: [`RefetchOptions`](../interfaces/RefetchOptions.md)) => `Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\> | A function to manually refetch the query. |
| <a id="result-property-status"></a> `status` | `"error"` \| `"pending"` \| `"success"` | The status of the query. - Will be: - `pending` if there's no cached data and no query attempt was finished yet. - `error` if the query attempt resulted in an error. - `success` if the query has received a response with no errors and is ready to display its data. |
