---
id: DefinedInitialDataOptions
title: DefinedInitialDataOptions
---

# Type Alias: DefinedInitialDataOptions\<TQueryFnData, TError, TData, TQueryKey\>

```ts
type DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> = Omit<QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>, "queryFn"> & object;
```

Defined in: [packages/lit-query/src/queryOptions.ts:16](https://github.com/TanStack/query/blob/main/packages/lit-query/src/queryOptions.ts#L16)

Query options with `initialData` that guarantees defined query data.

## Type Declaration

### initialData

```ts
initialData:
  | NonUndefinedGuard<TQueryFnData>
| () => NonUndefinedGuard<TQueryFnData>;
```

### queryFn?

```ts
optional queryFn: QueryFunction<TQueryFnData, TQueryKey>;
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
