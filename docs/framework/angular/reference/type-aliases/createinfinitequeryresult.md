---
id: CreateInfiniteQueryResult
title: CreateInfiniteQueryResult
---

# Type Alias: CreateInfiniteQueryResult\<TData, TError\>

```ts
type CreateInfiniteQueryResult<TData, TError> = BaseQueryNarrowing<TData, TError> & MapToSignals<InfiniteQueryObserverResult<TData, TError>>;
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

## Defined in

[types.ts:145](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L145)
