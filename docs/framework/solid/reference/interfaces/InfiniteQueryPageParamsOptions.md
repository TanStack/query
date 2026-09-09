---
id: InfiniteQueryPageParamsOptions
title: InfiniteQueryPageParamsOptions
---

Defined in: [packages/query-core/src/types.ts:352](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L352)

## Extends

- [`InitialPageParam`](InitialPageParam.md)\<`TPageParam`\>

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

Defined in: [packages/query-core/src/types.ts:365](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L365)

This function can be set to automatically get the next cursor for infinite queries.
The result will also be used to determine the value of `hasNextPage`.

***

### getPreviousPageParam?

```ts
optional getPreviousPageParam: GetPreviousPageParamFunction<TPageParam, TQueryFnData>;
```

Defined in: [packages/query-core/src/types.ts:360](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L360)

This function can be set to automatically get the previous cursor for infinite queries.
The result will also be used to determine the value of `hasPreviousPage`.

***

### initialPageParam

```ts
initialPageParam: TPageParam;
```

Defined in: [packages/query-core/src/types.ts:349](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L349)

#### Inherited from

[`InitialPageParam`](InitialPageParam.md).[`initialPageParam`](InitialPageParam.md#initialpageparam)
