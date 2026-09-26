---
id: DefinedInitialDataInfiniteOptions
title: DefinedInitialDataInfiniteOptions
---

```ts
type DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object;
```

Defined in: [packages/svelte-query/src/infiniteQueryOptions.ts:32](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/infiniteQueryOptions.ts#L32)

## Type Declaration

### initialData

```ts
initialData: 
  | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
| () => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>;
```

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`\>

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TPageParam

`TPageParam` = `unknown`
