---
id: GetPreviousPageParamFunction
title: GetPreviousPageParamFunction
---

```ts
type GetPreviousPageParamFunction<TPageParam, TQueryFnData> = (firstPage: TQueryFnData, allPages: TQueryFnData[], firstPageParam: TPageParam, allPageParams: TPageParam[]) => TPageParam | undefined | null;
```

Defined in: [packages/query-core/src/types.ts:296](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L296)

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
