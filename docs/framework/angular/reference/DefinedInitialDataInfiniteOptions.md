---
id: DefinedInitialDataInfiniteOptions
title: DefinedInitialDataInfiniteOptions
---

# Type Alias: DefinedInitialDataInfiniteOptions\<TQueryFnData, TError, TData, TQueryKey, TPageParam\>

```ts
type DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>: CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, TPageParam> & object;
```

## Type declaration

### initialData

```ts
initialData: NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>> | () => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>;
```

## Type Parameters

• **TQueryFnData**

• **TError** = `DefaultError`

• **TData** = `InfiniteData`\<`TQueryFnData`\>

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

• **TPageParam** = `unknown`

## Defined in

[infinite-query-options.ts:32](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/infinite-query-options.ts#L32)
