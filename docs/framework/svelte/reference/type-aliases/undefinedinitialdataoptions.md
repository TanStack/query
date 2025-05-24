---
id: UndefinedInitialDataOptions
title: UndefinedInitialDataOptions
---

# Type Alias: UndefinedInitialDataOptions\<TQueryFnData, TError, TData, TQueryKey\>

```ts
type UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> = CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object;
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

• **TQueryKey** *extends* `QueryKey` = `QueryKey`

## Defined in

[packages/svelte-query/src/queryOptions.ts:9](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/queryOptions.ts#L9)
