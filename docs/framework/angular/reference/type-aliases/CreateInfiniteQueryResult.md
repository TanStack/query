---
id: CreateInfiniteQueryResult
title: CreateInfiniteQueryResult
---

```ts
type CreateInfiniteQueryResult<TData, TError> = BaseQueryNarrowing<TData, TError> & MapToSignals<InfiniteQueryObserverResult<TData, TError>>;
```

Defined in: [packages/angular-query-experimental/src/types.ts:191](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L191)

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
