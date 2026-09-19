---
id: InitialPageParam
title: InitialPageParam
---

Defined in: [packages/query-core/src/types.ts:360](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L360)

## Extended by

- [`InfiniteQueryPageParamsOptions`](InfiniteQueryPageParamsOptions.md)

## Type Parameters

### TPageParam

`TPageParam` = `unknown`

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="initialpageparam"></a> `initialPageParam` | `TPageParam` | The page param to start from when an infinite query has no pages yet. It is passed to `queryFn` as `pageParam` for the first page; every page after that gets the value returned by `getNextPageParam` or `getPreviousPageParam`. It only applies while the query has no pages: once a first page exists, refetching starts from that page's own param instead. |
