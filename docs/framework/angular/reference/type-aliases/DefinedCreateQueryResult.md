---
id: DefinedCreateQueryResult
title: DefinedCreateQueryResult
---

```ts
type DefinedCreateQueryResult<TData, TError, TState> = BaseQueryNarrowing<TData, TError> & MapToSignals<OmitKeyof<TState, keyof BaseQueryNarrowing, "safely">>;
```

Defined in: [types.ts:175](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L175)

The result of `injectQuery` when `initialData` is set — `data` is never `undefined`. Same shape as
DefinedQueryObserverResult from `@tanstack/query-core`, but value fields are exposed as a
`Signal` while function fields are called directly, unchanged.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.

### TState

`TState` = `DefinedQueryObserverResult`\<`TData`, `TError`\>
