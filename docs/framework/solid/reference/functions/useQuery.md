---
id: useQuery
title: useQuery
redirect_from:
  - framework/solid/reference/useQuery
---

## Overview

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: () => QueryClient): UseQueryResult<TData, TError>;
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: () => QueryClient): DefinedUseQueryResult<TData, TError>;
```

- [`UndefinedInitialDataOptions` → `UseQueryResult`](#call-signature-1): Subscribes to a query: a declarative dependency on an asynchronous source of data that is tied to a unique key. The query runs when the options call for it — `enabled: false` skips the initial fetch.
- [`DefinedInitialDataOptions` → `DefinedUseQueryResult`](#call-signature-2): Subscribes to a query: a declarative dependency on an asynchronous source of data that is tied to a unique key. The query runs when the options call for it — `enabled: false` skips the initial fetch.

See also: [Parameters](#parameters-summary) · [Returns](#returns-summary)

<a id="call-signature-1"></a>

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: () => QueryClient): UseQueryResult<TData, TError>;
```

Defined in: [packages/solid-query/src/useQuery.ts:185](https://github.com/TanStack/query/blob/main/packages/solid-query/src/useQuery.ts#L185)

Subscribes to a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
The query runs when the options call for it — `enabled: false` skips the initial fetch.

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

An accessor returning the [UndefinedInitialDataOptions](../type-aliases/UndefinedInitialDataOptions.md) to use — everything you can
pass to `useQuery`.

#### queryClient?

() => [`QueryClient`](../classes/QueryClient.md)

An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
will be used.

### Returns

[`UseQueryResult`](../type-aliases/UseQueryResult.md)\<`TData`, `TError`\>

The current query result, as a Solid store. `status` is `pending` if there is no cached data to
display, `error` if the last fetch attempt failed, or `success` if the query has data to display.
`isPending`/`isSuccess`/`isError` are derived booleans for convenience.

### See

[queryOptions](queryOptions.md) to share these options between `useQuery` and imperative APIs like `queryClient.query`.

### Examples

```tsx
import { For, Match, Switch } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'

function Posts() {
  const postsQuery = useQuery(() => ({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  }))

  return (
    <Switch>
      <Match when={postsQuery.isPending}>Loading...</Match>
      <Match when={postsQuery.isError}>Error: {postsQuery.error.message}</Match>
      <Match when={postsQuery.isSuccess}>
        <ul>
          <For each={postsQuery.data}>{(post) => <li>{post.title}</li>}</For>
        </ul>
        <div>{postsQuery.isFetching ? 'Background Updating...' : ' '}</div>
      </Match>
    </Switch>
  )
}
```

`select` derives whatever `data` a component needs from the cached value, without changing what's
actually stored in the cache — the cache still holds the full `Post[]`, but `data` here is a `number`:
```tsx
import { Match, Switch } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'

function PostCount() {
  const postsQuery = useQuery(() => ({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    select: (posts) => posts.length,
  }))

  return (
    <Switch>
      <Match when={postsQuery.isPending}>Loading...</Match>
      <Match when={postsQuery.isError}>Error: {postsQuery.error.message}</Match>
      <Match when={postsQuery.isSuccess}>{postsQuery.data} posts</Match>
    </Switch>
  )
}
```

A dependent query, only enabled once `postId` is set:
```tsx
import { Match, Switch } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'

function Post(props: { postId: number | undefined }) {
  const postQuery = useQuery(() => ({
    queryKey: ['post', props.postId],
    queryFn: () => fetchPost(props.postId!),
    enabled: props.postId != null,
  }))

  return (
    <Switch fallback={<h1>{postQuery.data?.title}</h1>}>
      <Match when={props.postId == null}>Select a post</Match>
      <Match when={postQuery.isLoading}>Loading...</Match>
      <Match when={postQuery.isError}>Error: {postQuery.error.message}</Match>
    </Switch>
  )
}
```

The same dependent query, using `skipToken` to disable it in a type-safe way instead of relying on
`enabled`. The non-null assertion is still needed — Solid's `props` narrowing doesn't survive into the
`queryFn` closure the way a local `const` would — but `skipToken` keeps `queryFn`'s return type accurate
without it. `refetch` doesn't work while `queryFn` is `skipToken` — use `enabled: false` instead if you
need to trigger the query manually:
```tsx
import { Match, Switch } from 'solid-js'
import { skipToken, useQuery } from '@tanstack/solid-query'

function Post(props: { postId: number | undefined }) {
  const postQuery = useQuery(() => ({
    queryKey: ['post', props.postId],
    queryFn: props.postId != null ? () => fetchPost(props.postId!) : skipToken,
  }))

  return (
    <Switch fallback={<h1>{postQuery.data?.title}</h1>}>
      <Match when={props.postId == null}>Select a post</Match>
      <Match when={postQuery.isLoading}>Loading...</Match>
      <Match when={postQuery.isError}>Error: {postQuery.error.message}</Match>
    </Switch>
  )
}
```

Seeding a detail query from an already-cached list, to skip the loading state. `initialDataUpdatedAt` carries
over the list's own fetch time, so that if you set a `staleTime`, it's measured from when the list was
fetched rather than from now:
```tsx
import { useQuery, useQueryClient } from '@tanstack/solid-query'

function Post(props: { postId: number }) {
  const queryClient = useQueryClient()

  const postQuery = useQuery(() => ({
    queryKey: ['post', props.postId],
    queryFn: () => fetchPost(props.postId),
    initialData: () =>
      queryClient
        .getQueryData<Array<Post>>(['posts'])
        ?.find((post) => post.id === props.postId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['posts'])?.dataUpdatedAt,
  }))

  return postQuery.isError ? <span>Error: {postQuery.error.message}</span> : <h1>{postQuery.data?.title}</h1>
}
```

Paginated data, keeping the previous page's data visible while the next page loads:
```tsx
import { For, createSignal } from 'solid-js'
import { keepPreviousData, useQuery } from '@tanstack/solid-query'

function Posts() {
  const [page, setPage] = createSignal(0)

  const postsQuery = useQuery(() => ({
    queryKey: ['posts', page()],
    queryFn: () => fetchPosts(page()),
    placeholderData: keepPreviousData,
  }))

  return (
    <div>
      <ul>
        <For each={postsQuery.data}>{(post) => <li>{post.title}</li>}</For>
      </ul>
      <button
        disabled={postsQuery.isPlaceholderData}
        onClick={() => setPage((old) => old + 1)}
      >
        Next Page
      </button>
    </div>
  )
}
```

<a id="call-signature-2"></a>

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: () => QueryClient): DefinedUseQueryResult<TData, TError>;
```

Defined in: [packages/solid-query/src/useQuery.ts:237](https://github.com/TanStack/query/blob/main/packages/solid-query/src/useQuery.ts#L237)

Subscribes to a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
The query runs when the options call for it — `enabled: false` skips the initial fetch.

This overload is selected when `initialData` is set, so the resulting `data` is never `undefined` (unless
a `select` changes `TData` to include `undefined`).

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

An accessor returning the [DefinedInitialDataOptions](../type-aliases/DefinedInitialDataOptions.md) to use — everything you can
pass to `useQuery`, with `initialData` set.

#### queryClient?

() => [`QueryClient`](../classes/QueryClient.md)

An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
will be used.

### Returns

[`DefinedUseQueryResult`](../type-aliases/DefinedUseQueryResult.md)\<`TData`, `TError`\>

The current query result, as a Solid store, typed so that `status` is `success` — or `error` if a
fetch attempt fails while keeping the existing data (`status` never resolves to `pending` in this overload's
type, since `initialData` guarantees data upfront). `isSuccess`/`isError` are derived booleans for
convenience.

### See

[queryOptions](queryOptions.md) to share these options between `useQuery` and imperative APIs like `queryClient.query`.

### Example

```tsx
import { For } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'

function Posts() {
  // `postsQuery.data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
  // list stays visible alongside the error.
  const postsQuery = useQuery(() => ({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    initialData: [],
  }))

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

<a id="parameters-summary"></a>

## Parameters

### options

[`DefinedInitialDataOptions`](../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

An accessor returning the [DefinedInitialDataOptions](../type-aliases/DefinedInitialDataOptions.md) to use — everything you can
pass to `useQuery`, with `initialData` set.

### queryClient?

() => [`QueryClient`](../classes/QueryClient.md)

An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
will be used.

<a id="returns-summary"></a>

## Returns

[`DefinedUseQueryResult`](../type-aliases/DefinedUseQueryResult.md)\<`TData`, `TError`\>

The current query result, as a Solid store, typed so that `status` is `success` — or `error` if a
fetch attempt fails while keeping the existing data (`status` never resolves to `pending` in this overload's
type, since `initialData` guarantees data upfront). `isSuccess`/`isError` are derived booleans for
convenience.

<a id="result-properties"></a>

### Result properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="result-data"></a> `data` | `TData` \| `undefined` | The last successfully resolved data for the query. |
| <a id="result-dataupdatedat"></a> `dataUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"success"`. |
| <a id="result-error"></a> `error` | `TError` \| `null` | The error object for the query, if an error was thrown. - Defaults to `null`. |
| <a id="result-errorupdatecount"></a> `errorUpdateCount` | `number` | The sum of all errors. |
| <a id="result-errorupdatedat"></a> `errorUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"error"`. |
| <a id="result-failurecount"></a> `failureCount` | `number` | The failure count for the query. - Incremented every time the query fails. - Reset to `0` when the query succeeds. |
| <a id="result-failurereason"></a> `failureReason` | `TError` \| `null` | The failure reason for the query retry. - Reset to `null` when the query succeeds. |
| <a id="result-fetchstatus"></a> `fetchStatus` | `"fetching"` \| `"paused"` \| `"idle"` | The fetch status of the query. - `fetching`: Is `true` whenever the queryFn is executing, which includes initial `pending` as well as background refetch. - `paused`: The query wanted to fetch, but has been `paused`. - `idle`: The query is not fetching. - See [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. |
| <a id="result-isenabled"></a> `isEnabled` | `boolean` | `true` if this observer is enabled, `false` otherwise. |
| <a id="result-iserror"></a> `isError` | `boolean` | A derived boolean from the `status` variable, provided for convenience. - `true` if the query attempt resulted in an error. |
| <a id="result-isfetched"></a> `isFetched` | `boolean` | Will be `true` if the query has been fetched. |
| <a id="result-isfetchedaftermount"></a> `isFetchedAfterMount` | `boolean` | Will be `true` if the query has been fetched after the component mounted. - This property can be used to not show any previously cached data. |
| <a id="result-isfetching"></a> `isFetching` | `boolean` | A derived boolean from the `fetchStatus` variable, provided for convenience. - `true` whenever the `queryFn` is executing, which includes initial `pending` as well as background refetch. |
| <a id="result-isinitialloading"></a> ~~`isInitialLoading`~~ | `boolean` | **Deprecated** `isInitialLoading` is being deprecated in favor of `isLoading` and will be removed in the next major version. |
| <a id="result-isloading"></a> `isLoading` | `boolean` | Is `true` whenever the first fetch for a query is in-flight. - Is the same as `isFetching && isPending`. |
| <a id="result-isloadingerror"></a> `isLoadingError` | `boolean` | Will be `true` if the query failed while fetching for the first time. |
| <a id="result-ispaused"></a> `isPaused` | `boolean` | A derived boolean from the `fetchStatus` variable, provided for convenience. - The query wanted to fetch, but has been `paused`. |
| <a id="result-ispending"></a> `isPending` | `boolean` | Will be `pending` if there's no cached data and no query attempt was finished yet. |
| <a id="result-isplaceholderdata"></a> `isPlaceholderData` | `boolean` | Will be `true` if the data shown is the placeholder data. |
| <a id="result-isrefetcherror"></a> `isRefetchError` | `boolean` | Will be `true` if the query failed while refetching. |
| <a id="result-isrefetching"></a> `isRefetching` | `boolean` | Is `true` whenever a background refetch is in-flight, which _does not_ include initial `pending`. - Is the same as `isFetching && !isPending`. |
| <a id="result-isstale"></a> `isStale` | `boolean` | Will be `true` if the data in the cache is invalidated or if the data is older than the given `staleTime`. |
| <a id="result-issuccess"></a> `isSuccess` | `boolean` | A derived boolean from the `status` variable, provided for convenience. - `true` if the query has received a response with no errors and is ready to display its data. |
| <a id="result-refetch"></a> `refetch` | (`options?`: [`RefetchOptions`](../interfaces/RefetchOptions.md)) => `Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\> | A function to manually refetch the query. |
| <a id="result-status"></a> `status` | `"error"` \| `"pending"` \| `"success"` | The status of the query. - Will be: - `pending` if there's no cached data and no query attempt was finished yet. - `error` if the query attempt resulted in an error. - `success` if the query has received a response with no errors and is ready to display its data. |
