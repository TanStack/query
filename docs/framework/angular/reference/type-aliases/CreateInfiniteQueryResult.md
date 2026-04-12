---
id: CreateInfiniteQueryResult
title: CreateInfiniteQueryResult
---

# Type Alias: CreateInfiniteQueryResult\<TData, TError\>

```ts
type CreateInfiniteQueryResult<TData, TError> = BaseQueryNarrowing<TData, TError> & MapToSignals<InfiniteQueryObserverResult<TData, TError>, MethodKeys<InfiniteQueryObserverResult<TData, TError>>>;
```

Defined in: [types.ts:111](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L111)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`
