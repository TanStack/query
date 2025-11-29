---
id: StaleTimeFunction
title: StaleTimeFunction
---

# Type Alias: StaleTimeFunction\<TQueryFnData, TError, TData, TQueryKey\>

```ts
type StaleTimeFunction<TQueryFnData, TError, TData, TQueryKey> = StaleTime | (query) => StaleTime;
```

Defined in: [packages/query-core/src/types.ts:104](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L104)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
