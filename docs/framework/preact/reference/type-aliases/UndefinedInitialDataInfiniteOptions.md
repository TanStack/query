---
id: UndefinedInitialDataInfiniteOptions
title: UndefinedInitialDataInfiniteOptions
---

```ts
type UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:14](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L14)

## Type Declaration

### initialData?

```ts
optional initialData: 
  | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
| InitialDataFunction<NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>>;
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
