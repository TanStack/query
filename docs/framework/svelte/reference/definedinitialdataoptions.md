---
id: DefinedInitialDataOptions
title: DefinedInitialDataOptions
---

# Type Alias: DefinedInitialDataOptions\<TQueryFnData, TError, TData, TQueryKey\>

```ts
type DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object;
```

## Type declaration

### initialData

```ts
initialData: NonUndefinedGuard<TQueryFnData> | () => NonUndefinedGuard<TQueryFnData>;
```

## Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `DefaultError`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

## Defined in

[packages/svelte-query/src/queryOptions.ts:15](https://github.com/TanStack/query/blob/13817e953743537ffb9aab4da174583055be4d81/packages/svelte-query/src/queryOptions.ts#L15)
