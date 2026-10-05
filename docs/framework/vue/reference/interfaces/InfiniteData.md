---
id: InfiniteData
title: InfiniteData
---

Defined in: [packages/query-core/src/types.ts:313](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L313)

The data shape of an infinite query: every page fetched so far, plus the page param each one was fetched with.
`pages` and `pageParams` are index-aligned — `pageParams[i]` is the param that produced `pages[i]`.

## Type Parameters

### TData

`TData`

### TPageParam

`TPageParam` = `unknown`

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-pageparams"></a> `pageParams` | `TPageParam`[] | The page param each page was fetched with, aligned by index with `pages`. |
| <a id="property-pages"></a> `pages` | `TData`[] | The data of every page fetched so far, in order. |
