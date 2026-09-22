---
id: DefinedCreateQueryResult
title: DefinedCreateQueryResult
---

```ts
type DefinedCreateQueryResult<TData, TError, TState> = DefinedQueryNarrowing<TData, TError> & MapToSignals<OmitKeyof<TState, keyof DefinedQueryNarrowing, "safely">, QueryResultFields>;
```

Defined in: [packages/angular-query/src/types.ts:239](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L239)

The result of `injectQuery` when `initialData` is set — `data` is never `undefined`. Same shape as
[DefinedQueryObserverResult](DefinedQueryObserverResult.md) from `@tanstack/query-core`, but value fields are exposed as a
`Signal` while function fields are called directly, unchanged.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.

### TState

`TState` *extends* [`DefinedQueryObserverResult`](DefinedQueryObserverResult.md)\<`TData`, `TError`\> = [`DefinedQueryObserverResult`](DefinedQueryObserverResult.md)\<`TData`, `TError`\>
