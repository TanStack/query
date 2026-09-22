---
id: GetNextPageParamFunction
title: GetNextPageParamFunction
---

```ts
type GetNextPageParamFunction<TPageParam, TQueryFnData> = (lastPage: TQueryFnData, allPages: TQueryFnData[], lastPageParam: TPageParam, allPageParams: TPageParam[]) => TPageParam | undefined | null;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:76

## Type Parameters

### TPageParam

`TPageParam`

### TQueryFnData

`TQueryFnData` = `unknown`

## Parameters

### lastPage

`TQueryFnData`

### allPages

`TQueryFnData`[]

### lastPageParam

`TPageParam`

### allPageParams

`TPageParam`[]

## Returns

`TPageParam` \| `undefined` \| `null`
