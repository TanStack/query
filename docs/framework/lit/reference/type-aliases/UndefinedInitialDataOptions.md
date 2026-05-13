---
id: UndefinedInitialDataOptions
title: UndefinedInitialDataOptions
---

# Type Alias: UndefinedInitialDataOptions\<TQueryFnData, TError, TData, TQueryKey\>

```ts
type UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> = QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & object;
```

Defined in: [packages/lit-query/src/queryOptions.ts:58](https://github.com/TanStack/query/blob/main/packages/lit-query/src/queryOptions.ts#L58)

Query options where `initialData` can be omitted or undefined.

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

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`
