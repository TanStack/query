---
id: InitialPageParam
title: InitialPageParam
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:316

Holds the `initialPageParam` option that every infinite query requires.

## Extended by

- [`InfiniteQueryPageParamsOptions`](InfiniteQueryPageParamsOptions.md)

## Type Parameters

### TPageParam

`TPageParam` = `unknown`

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-initialpageparam"></a> `initialPageParam` | `TPageParam` | The page param to start from when an infinite query has no pages yet. It is passed to `queryFn` as `pageParam` for the first page; every page after that gets the value returned by `getNextPageParam` or `getPreviousPageParam`. It only applies while the query has no pages: once a first page exists, refetching starts from that page's own param instead. |
