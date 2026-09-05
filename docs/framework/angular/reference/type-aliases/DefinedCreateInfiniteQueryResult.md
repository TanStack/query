---
id: DefinedCreateInfiniteQueryResult
title: DefinedCreateInfiniteQueryResult
---

```ts
type DefinedCreateInfiniteQueryResult<TData, TError, TDefinedInfiniteQueryObserver> = MapToSignals<TDefinedInfiniteQueryObserver>;
```

Defined in: [types.ts:205](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L205)

The result of `injectInfiniteQuery` when `initialData` is set — `data` is never `undefined`. Same shape as
DefinedInfiniteQueryObserverResult from `@tanstack/query-core`, but value fields are exposed as a
`Signal` while function fields are called directly, unchanged.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.

### TDefinedInfiniteQueryObserver

`TDefinedInfiniteQueryObserver` = `DefinedInfiniteQueryObserverResult`\<`TData`, `TError`\>
