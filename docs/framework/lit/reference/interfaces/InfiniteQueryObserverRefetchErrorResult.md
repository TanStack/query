---
id: InfiniteQueryObserverRefetchErrorResult
title: InfiniteQueryObserverRefetchErrorResult
---

Defined in: [packages/query-core/src/types.ts:1152](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1152)

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
| <a id="property-data"></a> `data` | `TData` | The last successfully resolved data for the query. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`data`](InfiniteQueryObserverBaseResult.md#property-data) |
| <a id="property-dataupdatedat"></a> `dataUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"success"`. | - |
| <a id="property-error"></a> `error` | `TError` | The error object for the query, if an error was thrown. - Defaults to `null`. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`error`](InfiniteQueryObserverBaseResult.md#property-error) |
| <a id="property-errorupdatecount"></a> `errorUpdateCount` | `number` | The sum of all errors. | - |
| <a id="property-errorupdatedat"></a> `errorUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"error"`. | - |
| <a id="property-failurecount"></a> `failureCount` | `number` | The failure count for the query. - Incremented every time the query fails. - Reset to `0` when the query succeeds. | - |
| <a id="property-failurereason"></a> `failureReason` | `TError` \| `null` | The failure reason for the query retry. - Reset to `null` when the query succeeds. | - |
| <a id="property-fetchnextpage"></a> `fetchNextPage` | (`options?`: [`FetchNextPageOptions`](FetchNextPageOptions.md)) => `Promise`\<[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>\> | This function allows you to fetch the next "page" of results. | - |
| <a id="property-fetchpreviouspage"></a> `fetchPreviousPage` | (`options?`: [`FetchPreviousPageOptions`](FetchPreviousPageOptions.md)) => `Promise`\<[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>\> | This function allows you to fetch the previous "page" of results. | - |
| <a id="property-fetchstatus"></a> `fetchStatus` | `"fetching"` \| `"paused"` \| `"idle"` | The fetch status of the query. - `fetching`: Is `true` whenever the queryFn is executing, which includes initial `pending` as well as background refetch. - `paused`: The query wanted to fetch, but has been `paused`. - `idle`: The query is not fetching. - See [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. | - |
| <a id="property-hasnextpage"></a> `hasNextPage` | `boolean` | Will be `true` if there is a next page to be fetched (known via the `getNextPageParam` option). | - |
| <a id="property-haspreviouspage"></a> `hasPreviousPage` | `boolean` | Will be `true` if there is a previous page to be fetched (known via the `getPreviousPageParam` option). | - |
| <a id="property-isenabled"></a> `isEnabled` | `boolean` | `true` if this observer is enabled, `false` otherwise. | - |
| <a id="property-iserror"></a> `isError` | `true` | A derived boolean from the `status` variable, provided for convenience. - `true` if the query attempt resulted in an error. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isError`](InfiniteQueryObserverBaseResult.md#property-iserror) |
| <a id="property-isfetched"></a> `isFetched` | `boolean` | Will be `true` if the query has been fetched. | - |
| <a id="property-isfetchedaftermount"></a> `isFetchedAfterMount` | `boolean` | Will be `true` if the query has been fetched after the component mounted. - This property can be used to not show any previously cached data. | - |
| <a id="property-isfetching"></a> `isFetching` | `boolean` | A derived boolean from the `fetchStatus` variable, provided for convenience. - `true` whenever the `queryFn` is executing, which includes initial `pending` as well as background refetch. | - |
| <a id="property-isfetchingnextpage"></a> `isFetchingNextPage` | `boolean` | Will be `true` while fetching the next page with `fetchNextPage`. | - |
| <a id="property-isfetchingpreviouspage"></a> `isFetchingPreviousPage` | `boolean` | Will be `true` while fetching the previous page with `fetchPreviousPage`. | - |
| <a id="property-isfetchnextpageerror"></a> `isFetchNextPageError` | `boolean` | Will be `true` if the query failed while fetching the next page. | - |
| <a id="property-isfetchpreviouspageerror"></a> `isFetchPreviousPageError` | `boolean` | Will be `true` if the query failed while fetching the previous page. | - |
| <a id="property-isinitialloading"></a> ~~`isInitialLoading`~~ | `boolean` | **Deprecated** `isInitialLoading` is being deprecated in favor of `isLoading` and will be removed in the next major version. | - |
| <a id="property-isloading"></a> `isLoading` | `false` | Is `true` whenever the first fetch for a query is in-flight. - Is the same as `isFetching && isPending`. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isLoading`](InfiniteQueryObserverBaseResult.md#property-isloading) |
| <a id="property-isloadingerror"></a> `isLoadingError` | `false` | Will be `true` if the query failed while fetching for the first time. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isLoadingError`](InfiniteQueryObserverBaseResult.md#property-isloadingerror) |
| <a id="property-ispaused"></a> `isPaused` | `boolean` | A derived boolean from the `fetchStatus` variable, provided for convenience. - The query wanted to fetch, but has been `paused`. | - |
| <a id="property-ispending"></a> `isPending` | `false` | Will be `pending` if there's no cached data and no query attempt was finished yet. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isPending`](InfiniteQueryObserverBaseResult.md#property-ispending) |
| <a id="property-isplaceholderdata"></a> `isPlaceholderData` | `false` | Will be `true` if the data shown is the placeholder data. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isPlaceholderData`](InfiniteQueryObserverBaseResult.md#property-isplaceholderdata) |
| <a id="property-isrefetcherror"></a> `isRefetchError` | `true` | Will be `true` if the query failed while refetching. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isRefetchError`](InfiniteQueryObserverBaseResult.md#property-isrefetcherror) |
| <a id="property-isrefetching"></a> `isRefetching` | `boolean` | Is `true` whenever a background refetch is in-flight, which _does not_ include initial `pending`. - Is the same as `isFetching && !isPending`. | - |
| <a id="property-isstale"></a> `isStale` | `boolean` | Will be `true` if the data in the cache is invalidated or if the data is older than the given `staleTime`. | - |
| <a id="property-issuccess"></a> `isSuccess` | `false` | A derived boolean from the `status` variable, provided for convenience. - `true` if the query has received a response with no errors and is ready to display its data. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`isSuccess`](InfiniteQueryObserverBaseResult.md#property-issuccess) |
| <a id="property-refetch"></a> `refetch` | (`options?`: [`RefetchOptions`](RefetchOptions.md)) => `Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\> | A function to manually refetch the query. | - |
| <a id="property-status"></a> `status` | `"error"` | The status of the query. - Will be: - `pending` if there's no cached data and no query attempt was finished yet. - `error` if the query attempt resulted in an error. - `success` if the query has received a response with no errors and is ready to display its data. | [`InfiniteQueryObserverBaseResult`](InfiniteQueryObserverBaseResult.md).[`status`](InfiniteQueryObserverBaseResult.md#property-status) |
