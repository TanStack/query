---
id: DefinedInitialDataInfiniteOptions
title: DefinedInitialDataInfiniteOptions
---

# Type Alias: DefinedInitialDataInfiniteOptions\<TQueryFnData, TError, TData, TQueryKey, TPageParam\>

```ts
type DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:57](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L57)

## Type Declaration

### initialData

```ts
initialData: 
  | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
  | () => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
  | undefined;
```

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TError

`TError` = `DefaultError`

### TData

`TData` = `InfiniteData`\<`TQueryFnData`\>

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

### TPageParam

`TPageParam` = `unknown`
