---
id: InfiniteQueryPageParamsOptions
title: InfiniteQueryPageParamsOptions
---

Defined in: [packages/query-core/src/types.ts:364](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L364)

## Extends

- [`InitialPageParam`](InitialPageParam.md)\<`TPageParam`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TPageParam

`TPageParam` = `unknown`

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="getnextpageparam"></a> `getNextPageParam` | (`lastPage`: `TQueryFnData`, `allPages`: `TQueryFnData`[], `lastPageParam`: `TPageParam`, `allPageParams`: `TPageParam`[]) => `TPageParam` \| `null` \| `undefined` | This function can be set to automatically get the next cursor for infinite queries. The result will also be used to determine the value of `hasNextPage`. |
| <a id="getpreviouspageparam"></a> `getPreviousPageParam?` | (`firstPage`: `TQueryFnData`, `allPages`: `TQueryFnData`[], `firstPageParam`: `TPageParam`, `allPageParams`: `TPageParam`[]) => `TPageParam` \| `null` \| `undefined` | This function can be set to automatically get the previous cursor for infinite queries. The result will also be used to determine the value of `hasPreviousPage`. |
| <a id="initialpageparam"></a> `initialPageParam` | `TPageParam` | - |
