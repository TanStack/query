---
id: GetPreviousPageParamFunction
title: GetPreviousPageParamFunction
---

# Type Alias: GetPreviousPageParamFunction()\<TPageParam, TQueryFnData\>

```ts
type GetPreviousPageParamFunction<TPageParam, TQueryFnData> = (firstPage, allPages, firstPageParam, allPageParams) => TPageParam | undefined | null;
```

Defined in: [packages/query-core/src/types.ts:190](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L190)

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
