---
id: GetPreviousPageParamFunction
title: GetPreviousPageParamFunction
---

```ts
type GetPreviousPageParamFunction<TPageParam, TQueryFnData> = (firstPage, allPages, firstPageParam, allPageParams) => TPageParam | undefined | null;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:75

## Type Parameters

### TPageParam

`TPageParam`

### TQueryFnData

`TQueryFnData` = `unknown`

## Parameters

### firstPage

`TQueryFnData`

### allPages

`TQueryFnData`[]

### firstPageParam

`TPageParam`

### allPageParams

`TPageParam`[]

## Returns

`TPageParam` \| `undefined` \| `null`
