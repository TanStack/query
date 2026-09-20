---
id: CreateInfiniteQueryResult
title: CreateInfiniteQueryResult
---

```ts
type CreateInfiniteQueryResult<TData, TError, TState> = BaseInfiniteQueryNarrowing<TData, TError> & MapToSignals<TState, InfiniteQueryResultFields>;
```

Defined in: [packages/angular-query/src/types.ts:259](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L259)

The result of `injectInfiniteQuery` when `initialData` isn't set — `data` may be `undefined` while the
query is `pending`. Same shape as [InfiniteQueryObserverResult](InfiniteQueryObserverResult.md) from `@tanstack/query-core`, but
value fields are exposed as a `Signal` while function fields (like `fetchNextPage`) are called directly,
unchanged.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.

### TState

`TState` *extends* [`InfiniteQueryObserverResult`](InfiniteQueryObserverResult.md)\<`TData`, `TError`\> = [`InfiniteQueryObserverResult`](InfiniteQueryObserverResult.md)\<`TData`, `TError`\>
