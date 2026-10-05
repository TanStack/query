---
id: UndefinedInitialDataInfiniteOptions
title: UndefinedInitialDataInfiniteOptions
---

```ts
type UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
  initialData?:   | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
     | InitialDataFunction<NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>>;
};
```

Defined in: [packages/svelte-query/src/infiniteQueryOptions.ts:15](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/infiniteQueryOptions.ts#L15)

The options accepted by the `infiniteQueryOptions` overload selected when `initialData` is omitted or may
be `undefined` — `data` may be `undefined` while the query is `pending`.

## Type Declaration

### initialData?

```ts
optional initialData?: 
  | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
| InitialDataFunction<NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>>;
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
