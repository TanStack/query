---
id: CreateBaseQueryResult
title: CreateBaseQueryResult
---

```ts
type CreateBaseQueryResult<TData, TError, TState> = BaseQueryNarrowing<TData, TError> & MapToSignals<OmitKeyof<TState, keyof BaseQueryNarrowing, "safely">, QueryResultFields>;
```

Defined in: [packages/angular-query/src/types.ts:207](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L207)

The result of `injectQuery` when `initialData` isn't set — `data` may be `undefined` while the query is
`pending`. Same shape as [QueryObserverResult](QueryObserverResult.md) from `@tanstack/query-core`, but value fields (like
`data`, `error`, `status`) are exposed as a `Signal` — read them with `query.data()`, not `query.data` —
while function fields (like `refetch`) are called directly, unchanged. `isSuccess`/`isError`/`isPending`
are [BaseQueryNarrowing](../interfaces/BaseQueryNarrowing.md) type-guard methods rather than plain booleans.
`injectInfiniteQuery` returns [CreateInfiniteQueryResult](CreateInfiniteQueryResult.md) instead.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.

### TState

`TState` *extends* [`QueryObserverResult`](QueryObserverResult.md)\<`TData`, `TError`\> = [`QueryObserverResult`](QueryObserverResult.md)\<`TData`, `TError`\>
