---
id: InfiniteQueryPageParamsOptions
title: InfiniteQueryPageParamsOptions
---

Defined in: [packages/query-core/src/types.ts:345](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L345)

## Extends

- [`InitialPageParam`](InitialPageParam.md)\<`TPageParam`\>

## Extended by

- [`InfiniteQueryObserverOptions`](InfiniteQueryObserverOptions.md)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TPageParam

`TPageParam` = `unknown`

## Properties

### getNextPageParam

```ts
getNextPageParam: GetNextPageParamFunction<TPageParam, TQueryFnData>;
```

Defined in: [packages/query-core/src/types.ts:358](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L358)

This function can be set to automatically get the next cursor for infinite queries.
The result will also be used to determine the value of `hasNextPage`.

***

### getPreviousPageParam?

```ts
optional getPreviousPageParam: GetPreviousPageParamFunction<TPageParam, TQueryFnData>;
```

Defined in: [packages/query-core/src/types.ts:353](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L353)

This function can be set to automatically get the previous cursor for infinite queries.
The result will also be used to determine the value of `hasPreviousPage`.

***

### initialPageParam

```ts
initialPageParam: TPageParam;
```

Defined in: [packages/query-core/src/types.ts:342](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L342)

#### Inherited from

[`InitialPageParam`](InitialPageParam.md).[`initialPageParam`](InitialPageParam.md#initialpageparam)
