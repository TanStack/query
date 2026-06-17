---
id: DefinedCreateInfiniteQueryResult
title: DefinedCreateInfiniteQueryResult
---

# Type Alias: DefinedCreateInfiniteQueryResult\<TData, TError, TDefinedInfiniteQueryObserver\>

```ts
type DefinedCreateInfiniteQueryResult<TData, TError, TDefinedInfiniteQueryObserver> = MapToSignals<TDefinedInfiniteQueryObserver, MethodKeys<TDefinedInfiniteQueryObserver>>;
```

Defined in: [types.ts:120](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L120)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

### TDefinedInfiniteQueryObserver

`TDefinedInfiniteQueryObserver` = `DefinedInfiniteQueryObserverResult`\<`TData`, `TError`\>
