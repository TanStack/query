---
id: QueryState
title: QueryState
---

Defined in: [packages/query-core/src/query.ts:52](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L52)

The raw state stored on a `Query` instance. This is the underlying state
that observer results (e.g. `QueryObserverResult`) are derived from.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="data"></a> `data` | `TData` \| `undefined` | The last successfully resolved data for the query. |
| <a id="dataupdatecount"></a> `dataUpdateCount` | `number` | The number of times the query has successfully resolved. |
| <a id="dataupdatedat"></a> `dataUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"success"`. |
| <a id="error"></a> `error` | `TError` \| `null` | The error object for the query, if the last attempt resulted in an error. - Defaults to `null`. |
| <a id="errorupdatecount"></a> `errorUpdateCount` | `number` | The sum of all errors, incremented every time the query resolves with an error. |
| <a id="errorupdatedat"></a> `errorUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"error"`. |
| <a id="fetchfailurecount"></a> `fetchFailureCount` | `number` | The failure count for the current fetch. - Incremented every time the fetch fails. - Reset to `0` when the fetch succeeds. |
| <a id="fetchfailurereason"></a> `fetchFailureReason` | `TError` \| `null` | The reason the current fetch failed, as reported by the retryer. - Reset to `null` when the fetch succeeds. |
| <a id="fetchmeta"></a> `fetchMeta` | `FetchMeta` \| `null` | Metadata passed to the currently in-flight (or most recent) fetch, e.g. the `fetchMore` direction for infinite queries. |
| <a id="fetchstatus"></a> `fetchStatus` | [`FetchStatus`](../type-aliases/FetchStatus.md) | The fetch status of the query. - `fetching`: the `queryFn` is currently executing. - `paused`: a fetch wanted to run but has been paused (see network mode). - `idle`: the query is not fetching. |
| <a id="isinvalidated"></a> `isInvalidated` | `boolean` | Whether the query has been marked as invalidated via `invalidate()`. - Reset to `false` whenever the query resolves successfully. |
| <a id="status"></a> `status` | [`QueryStatus`](../type-aliases/QueryStatus.md) | The status of the query. - `pending` if there's no cached data and no attempt was finished yet. - `error` if the last attempt resulted in an error. - `success` if the query has data. |
