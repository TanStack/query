---
id: InfiniteQueryObserverLoadingResult
title: InfiniteQueryObserverLoadingResult
---

Defined in: [packages/query-core/src/types.ts:1509](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1509)

An infinite query result in the `pending` state while the first fetch is in flight, so
`isLoading` is `true`.

## Extends

- [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md)\<`TData`, `TError`\>

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

| Property | Type | Description | Overrides |
| ------ | ------ | ------ | ------ |
| <a id="data"></a> `data` | `undefined` | `undefined`, since the query has no data yet. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`data`](InfiniteQueryObserverBaseResult.md#data) |
| <a id="dataupdatedat"></a> `dataUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"success"`. | - |
| <a id="error"></a> `error` | `null` | `null`, since the query isn't in the `error` state. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`error`](InfiniteQueryObserverBaseResult.md#error) |
| <a id="errorupdatecount"></a> `errorUpdateCount` | `number` | The sum of all errors. | - |
| <a id="errorupdatedat"></a> `errorUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"error"`. | - |
| <a id="failurecount"></a> `failureCount` | `number` | The failure count for the query. - Incremented every time the query fails. - Reset to `0` when the query succeeds. | - |
| <a id="failurereason"></a> `failureReason` | `TError` \| `null` | The failure reason for the query retry. - Reset to `null` when the query succeeds. | - |
| <a id="fetchnextpage"></a> `fetchNextPage` | (`options?`: [`FetchNextPageOptions`](FetchNextPageOptions.md)) => `Promise`\<[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>\> | This function allows you to fetch the next "page" of results. | - |
| <a id="fetchpreviouspage"></a> `fetchPreviousPage` | (`options?`: [`FetchPreviousPageOptions`](FetchPreviousPageOptions.md)) => `Promise`\<[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>\> | This function allows you to fetch the previous "page" of results. | - |
| <a id="fetchstatus"></a> `fetchStatus` | `"fetching"` \| `"paused"` \| `"idle"` | The fetch status of the query. - `fetching`: Is `true` whenever the queryFn is executing, which includes initial `pending` as well as background refetch. - `paused`: The query wanted to fetch, but has been `paused`. - `idle`: The query is not fetching. - See [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. | - |
| <a id="hasnextpage"></a> `hasNextPage` | `boolean` | Will be `true` if there is a next page to be fetched (known via the `getNextPageParam` option). | - |
| <a id="haspreviouspage"></a> `hasPreviousPage` | `boolean` | Will be `true` if there is a previous page to be fetched (known via the `getPreviousPageParam` option). | - |
| <a id="isenabled"></a> `isEnabled` | `boolean` | `true` if this observer is enabled, `false` otherwise. | - |
| <a id="iserror"></a> `isError` | `false` | `false`, since the query isn't in the `error` state. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isError`](InfiniteQueryObserverBaseResult.md#iserror) |
| <a id="isfetched"></a> `isFetched` | `boolean` | Will be `true` if the query has been fetched. | - |
| <a id="isfetchedaftermount"></a> `isFetchedAfterMount` | `boolean` | Will be `true` if the query has been fetched after the component mounted. - This property can be used to not show any previously cached data. | - |
| <a id="isfetching"></a> `isFetching` | `boolean` | A derived boolean from the `fetchStatus` variable, provided for convenience. - `true` whenever the `queryFn` is executing, which includes initial `pending` as well as background refetch. | - |
| <a id="isfetchingnextpage"></a> `isFetchingNextPage` | `boolean` | Will be `true` while fetching the next page with `fetchNextPage`. | - |
| <a id="isfetchingpreviouspage"></a> `isFetchingPreviousPage` | `boolean` | Will be `true` while fetching the previous page with `fetchPreviousPage`. | - |
| <a id="isfetchnextpageerror"></a> `isFetchNextPageError` | `false` | `false`, since fetching the next page didn't fail. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isFetchNextPageError`](InfiniteQueryObserverBaseResult.md#isfetchnextpageerror) |
| <a id="isfetchpreviouspageerror"></a> `isFetchPreviousPageError` | `false` | `false`, since fetching the previous page didn't fail. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isFetchPreviousPageError`](InfiniteQueryObserverBaseResult.md#isfetchpreviouspageerror) |
| <a id="isinitialloading"></a> ~~`isInitialLoading`~~ | `boolean` | **Deprecated** `isInitialLoading` is being deprecated in favor of `isLoading` and will be removed in the next major version. | - |
| <a id="isloading"></a> `isLoading` | `true` | `true`, since the first fetch is in flight. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isLoading`](InfiniteQueryObserverBaseResult.md#isloading) |
| <a id="isloadingerror"></a> `isLoadingError` | `false` | `false`, since the query didn't fail while fetching for the first time. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isLoadingError`](InfiniteQueryObserverBaseResult.md#isloadingerror) |
| <a id="ispaused"></a> `isPaused` | `boolean` | A derived boolean from the `fetchStatus` variable, provided for convenience. - The query wanted to fetch, but has been `paused`. | - |
| <a id="ispending"></a> `isPending` | `true` | `true`, since there's no cached data and no query attempt has finished yet. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isPending`](InfiniteQueryObserverBaseResult.md#ispending) |
| <a id="isplaceholderdata"></a> `isPlaceholderData` | `false` | `false`, since the data shown isn't the `placeholderData`. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isPlaceholderData`](InfiniteQueryObserverBaseResult.md#isplaceholderdata) |
| <a id="isrefetcherror"></a> `isRefetchError` | `false` | `false`, since the query didn't fail while refetching. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isRefetchError`](InfiniteQueryObserverBaseResult.md#isrefetcherror) |
| <a id="isrefetching"></a> `isRefetching` | `boolean` | Is `true` whenever a background refetch is in-flight, which _does not_ include initial `pending`. - Is the same as `isFetching && !isPending`. | - |
| <a id="isstale"></a> `isStale` | `boolean` | Will be `true` if the data in the cache is invalidated or if the data is older than the given `staleTime`. | - |
| <a id="issuccess"></a> `isSuccess` | `false` | `false`, since the query isn't in the `success` state. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isSuccess`](InfiniteQueryObserverBaseResult.md#issuccess) |
| <a id="refetch"></a> `refetch` | (`options?`: [`RefetchOptions`](RefetchOptions.md)) => `Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\> | A function to manually refetch the query. | - |
| <a id="status"></a> `status` | `"pending"` | `'pending'`, since there's no cached data and no query attempt has finished yet. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`status`](InfiniteQueryObserverBaseResult.md#status) |
