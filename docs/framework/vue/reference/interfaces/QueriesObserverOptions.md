---
id: QueriesObserverOptions
title: QueriesObserverOptions
---

Defined in: [packages/query-core/src/queriesObserver.ts:32](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L32)

Options for a `QueriesObserver` that apply to all of its queries at once.

## Type Parameters

### TCombinedResult

`TCombinedResult` = [`QueryObserverResult`](../type-aliases/QueryObserverResult.md)[]

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-combine"></a> `combine?` | `CombineFn`\<`TCombinedResult`\> | A function that combines the array of `QueryObserverResult`s (one per observed query) into a single value. The combined value is memoized and only recomputed when one of the underlying results, the query hashes, or the `combine` function itself changes. Defaults to returning the array of `QueryObserverResult`s unchanged. |
