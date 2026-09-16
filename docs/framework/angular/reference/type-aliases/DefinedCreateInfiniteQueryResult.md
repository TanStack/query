---
id: DefinedCreateInfiniteQueryResult
title: DefinedCreateInfiniteQueryResult
---

```ts
type DefinedCreateInfiniteQueryResult<TData, TError, TDefinedInfiniteQueryObserver> = DefinedInfiniteQueryNarrowing<TData, TError> & MapToSignals<TDefinedInfiniteQueryObserver, MethodKeys<TDefinedInfiniteQueryObserver>>;
```

Defined in: [packages/angular-query/src/types.ts:228](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L228)

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.

### TDefinedInfiniteQueryObserver

`TDefinedInfiniteQueryObserver` *extends* `DefinedInfiniteQueryObserverResult`\<`TData`, `TError`\> = `DefinedInfiniteQueryObserverResult`\<`TData`, `TError`\>
