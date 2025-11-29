---
id: InfiniteQueryPageParamsOptions
title: InfiniteQueryPageParamsOptions
---

# Interface: InfiniteQueryPageParamsOptions\<TQueryFnData, TPageParam\>

Defined in: [packages/query-core/src/types.ts:284](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L284)

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

Defined in: [packages/query-core/src/types.ts:297](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L297)

This function can be set to automatically get the next cursor for infinite queries.
The result will also be used to determine the value of `hasNextPage`.

***

### getPreviousPageParam?

```ts
optional getPreviousPageParam: GetPreviousPageParamFunction<TPageParam, TQueryFnData>;
```

Defined in: [packages/query-core/src/types.ts:292](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L292)

This function can be set to automatically get the previous cursor for infinite queries.
The result will also be used to determine the value of `hasPreviousPage`.

***

### initialPageParam

```ts
initialPageParam: TPageParam;
```

Defined in: [packages/query-core/src/types.ts:281](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L281)

#### Inherited from

[`InitialPageParam`](InitialPageParam.md).[`initialPageParam`](InitialPageParam.md#initialpageparam)
