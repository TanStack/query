---
id: DefinedCreateInfiniteQueryResult
title: DefinedCreateInfiniteQueryResult
---

```ts
type DefinedCreateInfiniteQueryResult<TData, TError, TDefinedInfiniteQueryObserver> = DefinedInfiniteQueryNarrowing<TData, TError> & MapToSignals<TDefinedInfiniteQueryObserver, InfiniteQueryResultFields>;
```

Defined in: [packages/angular-query/src/types.ts:275](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L275)

The result of `injectInfiniteQuery` when `initialData` is set — `data` is never `undefined`. Same shape as
[DefinedInfiniteQueryObserverResult](DefinedInfiniteQueryObserverResult.md) from `@tanstack/query-core`, but value fields are exposed as a
`Signal` while function fields are called directly, unchanged.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.

### TDefinedInfiniteQueryObserver

`TDefinedInfiniteQueryObserver` *extends* [`DefinedInfiniteQueryObserverResult`](DefinedInfiniteQueryObserverResult.md)\<`TData`, `TError`\> = [`DefinedInfiniteQueryObserverResult`](DefinedInfiniteQueryObserverResult.md)\<`TData`, `TError`\>
