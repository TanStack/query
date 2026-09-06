---
id: UndefinedInitialQueryOptions
title: UndefinedInitialQueryOptions
---

```ts
type UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey> = UseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & object;
```

Defined in: [packages/vue-query/src/useQuery.ts:67](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useQuery.ts#L67)

## Type Declaration

### initialData?

```ts
optional initialData: 
  | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
| NonUndefinedGuard<TQueryFnData>;
```

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
