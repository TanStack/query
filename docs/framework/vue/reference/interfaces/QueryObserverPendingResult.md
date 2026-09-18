---
id: QueryObserverPendingResult
title: QueryObserverPendingResult
---

Defined in: [packages/query-core/src/types.ts:892](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L892)

## Extends

- [`QueryObserverBaseResult`](QueryObserverBaseResult.md)\<`TData`, `TError`\>

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

| Property | Type | Description | Overrides |
| ------ | ------ | ------ | ------ |
| <a id="data"></a> `data` | `undefined` | The last successfully resolved data for the query. | [`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`data`](QueryObserverBaseResult.md#data) |
| <a id="dataupdatedat"></a> `dataUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"success"`. | - |
| <a id="error"></a> `error` | `null` | The error object for the query, if an error was thrown. - Defaults to `null`. | [`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`error`](QueryObserverBaseResult.md#error) |
| <a id="errorupdatecount"></a> `errorUpdateCount` | `number` | The sum of all errors. | - |
| <a id="errorupdatedat"></a> `errorUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"error"`. | - |
| <a id="failurecount"></a> `failureCount` | `number` | The failure count for the query. - Incremented every time the query fails. - Reset to `0` when the query succeeds. | - |
| <a id="failurereason"></a> `failureReason` | `TError` \| `null` | The failure reason for the query retry. - Reset to `null` when the query succeeds. | - |
| <a id="fetchstatus"></a> `fetchStatus` | [`FetchStatus`](../type-aliases/FetchStatus.md) | The fetch status of the query. - `fetching`: Is `true` whenever the queryFn is executing, which includes initial `pending` as well as background refetch. - `paused`: The query wanted to fetch, but has been `paused`. - `idle`: The query is not fetching. - See [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. | - |
| <a id="isenabled"></a> `isEnabled` | `boolean` | `true` if this observer is enabled, `false` otherwise. | - |
| <a id="iserror"></a> `isError` | `false` | A derived boolean from the `status` variable, provided for convenience. - `true` if the query attempt resulted in an error. | [`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isError`](QueryObserverBaseResult.md#iserror) |
| <a id="isfetched"></a> `isFetched` | `boolean` | Will be `true` if the query has been fetched. | - |
| <a id="isfetchedaftermount"></a> `isFetchedAfterMount` | `boolean` | Will be `true` if the query has been fetched after the component mounted. - This property can be used to not show any previously cached data. | - |
| <a id="isfetching"></a> `isFetching` | `boolean` | A derived boolean from the `fetchStatus` variable, provided for convenience. - `true` whenever the `queryFn` is executing, which includes initial `pending` as well as background refetch. | - |
| <a id="isinitialloading"></a> ~~`isInitialLoading`~~ | `boolean` | **Deprecated** `isInitialLoading` is being deprecated in favor of `isLoading` and will be removed in the next major version. | - |
| <a id="isloading"></a> `isLoading` | `boolean` | Is `true` whenever the first fetch for a query is in-flight. - Is the same as `isFetching && isPending`. | - |
| <a id="isloadingerror"></a> `isLoadingError` | `false` | Will be `true` if the query failed while fetching for the first time. | [`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isLoadingError`](QueryObserverBaseResult.md#isloadingerror) |
| <a id="ispaused"></a> `isPaused` | `boolean` | A derived boolean from the `fetchStatus` variable, provided for convenience. - The query wanted to fetch, but has been `paused`. | - |
| <a id="ispending"></a> `isPending` | `true` | Will be `pending` if there's no cached data and no query attempt was finished yet. | [`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isPending`](QueryObserverBaseResult.md#ispending) |
| <a id="isplaceholderdata"></a> `isPlaceholderData` | `false` | Will be `true` if the data shown is the placeholder data. | [`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isPlaceholderData`](QueryObserverBaseResult.md#isplaceholderdata) |
| <a id="isrefetcherror"></a> `isRefetchError` | `false` | Will be `true` if the query failed while refetching. | [`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isRefetchError`](QueryObserverBaseResult.md#isrefetcherror) |
| <a id="isrefetching"></a> `isRefetching` | `boolean` | Is `true` whenever a background refetch is in-flight, which _does not_ include initial `pending`. - Is the same as `isFetching && !isPending`. | - |
| <a id="isstale"></a> `isStale` | `boolean` | Will be `true` if the data in the cache is invalidated or if the data is older than the given `staleTime`. | - |
| <a id="issuccess"></a> `isSuccess` | `false` | A derived boolean from the `status` variable, provided for convenience. - `true` if the query has received a response with no errors and is ready to display its data. | [`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`isSuccess`](QueryObserverBaseResult.md#issuccess) |
| <a id="refetch"></a> `refetch` | (`options?`: [`RefetchOptions`](RefetchOptions.md)) => `Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\> | A function to manually refetch the query. | - |
| <a id="status"></a> `status` | `"pending"` | The status of the query. - Will be: - `pending` if there's no cached data and no query attempt was finished yet. - `error` if the query attempt resulted in an error. - `success` if the query has received a response with no errors and is ready to display its data. | [`QueryObserverBaseResult`](QueryObserverBaseResult.md).[`status`](QueryObserverBaseResult.md#status) |
