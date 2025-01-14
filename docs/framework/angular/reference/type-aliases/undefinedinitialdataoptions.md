---
id: UndefinedInitialDataOptions
title: UndefinedInitialDataOptions
---

# Type Alias: UndefinedInitialDataOptions\<TQueryFnData, TError, TData, TQueryKey\>

```ts
type UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> =
  CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object
```

## Type declaration

### initialData?

```ts
optional initialData: InitialDataFunction<NonUndefinedGuard<TQueryFnData>>;
```

## Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `DefaultError`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

## Defined in

[query-options.ts:12](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L12)
