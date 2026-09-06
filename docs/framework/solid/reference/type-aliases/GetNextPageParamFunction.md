---
id: GetNextPageParamFunction
title: GetNextPageParamFunction
---

```ts
type GetNextPageParamFunction<TPageParam, TQueryFnData> = (lastPage, allPages, lastPageParam, allPageParams) => TPageParam | undefined | null;
```

Defined in: [packages/query-core/src/types.ts:203](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L203)

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
