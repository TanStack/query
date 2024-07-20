---
id: UndefinedInitialDataOptions
title: UndefinedInitialDataOptions
---

# Type Alias: UndefinedInitialDataOptions\<TQueryFnData, TError, TData, TQueryKey\>

```ts
type UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object;
```

## Type declaration

### initialData?

```ts
optional initialData: undefined;
```

## Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `DefaultError`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

## Defined in

[packages/svelte-query/src/queryOptions.ts:4](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/svelte-query/src/queryOptions.ts#L4)
