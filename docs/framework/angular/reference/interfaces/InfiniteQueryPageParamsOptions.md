---
id: InfiniteQueryPageParamsOptions
title: InfiniteQueryPageParamsOptions
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:197

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

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="getnextpageparam"></a> `getNextPageParam` | [`GetNextPageParamFunction`](../type-aliases/GetNextPageParamFunction.md)\<`TPageParam`, `TQueryFnData`\> | This function can be set to automatically get the next cursor for infinite queries. The result will also be used to determine the value of `hasNextPage`. |
| <a id="getpreviouspageparam"></a> `getPreviousPageParam?` | [`GetPreviousPageParamFunction`](../type-aliases/GetPreviousPageParamFunction.md)\<`TPageParam`, `TQueryFnData`\> | This function can be set to automatically get the previous cursor for infinite queries. The result will also be used to determine the value of `hasPreviousPage`. |
| <a id="initialpageparam"></a> `initialPageParam` | `TPageParam` | - |
