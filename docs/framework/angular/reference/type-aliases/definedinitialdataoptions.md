---
id: DefinedInitialDataOptions
title: DefinedInitialDataOptions
---

# Type Alias: DefinedInitialDataOptions\<TQueryFnData, TError, TData, TQueryKey\>

```ts
type DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> =
  CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object
```

## Type declaration

### initialData

```ts
initialData:
  | NonUndefinedGuard<TQueryFnData>
| () => NonUndefinedGuard<TQueryFnData>;
```

## Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `DefaultError`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

## Defined in

[query-options.ts:24](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L24)
