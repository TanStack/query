---
id: InfiniteQueryPageParamsOptions
title: InfiniteQueryPageParamsOptions
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:190

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:200

This function can be set to automatically get the next cursor for infinite queries.
The result will also be used to determine the value of `hasNextPage`.

***

### getPreviousPageParam?

```ts
optional getPreviousPageParam: GetPreviousPageParamFunction<TPageParam, TQueryFnData>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:195

This function can be set to automatically get the previous cursor for infinite queries.
The result will also be used to determine the value of `hasPreviousPage`.

***

### initialPageParam

```ts
initialPageParam: TPageParam;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:188

#### Inherited from

[`InitialPageParam`](InitialPageParam.md).[`initialPageParam`](InitialPageParam.md#initialpageparam)
