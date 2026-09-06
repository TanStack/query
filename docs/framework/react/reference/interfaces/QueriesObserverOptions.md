---
id: QueriesObserverOptions
title: QueriesObserverOptions
---

Defined in: [packages/query-core/src/queriesObserver.ts:23](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L23)

## Type Parameters

### TCombinedResult

`TCombinedResult` = [`QueryObserverResult`](../type-aliases/QueryObserverResult.md)[]

## Properties

### combine?

```ts
optional combine: CombineFn<TCombinedResult>;
```

Defined in: [packages/query-core/src/queriesObserver.ts:34](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L34)

A function that combines the array of `QueryObserverResult`s (one per
observed query) into a single value. The combined value is memoized and
only recomputed when one of the underlying results, the query hashes, or
the `combine` function itself changes.

Defaults to returning the array of `QueryObserverResult`s unchanged.
