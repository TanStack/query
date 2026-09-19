---
id: InfiniteData
title: InfiniteData
---

Defined in: [packages/query-core/src/types.ts:251](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L251)

The data shape of an infinite query: every page fetched so far, plus the page param each one was fetched with.
`pages` and `pageParams` are index-aligned — `pageParams[i]` is the param that produced `pages[i]`.

## Type Parameters

### TData

`TData`

### TPageParam

`TPageParam` = `unknown`

## Properties

| Property | Type |
| ------ | ------ |
| <a id="pageparams"></a> `pageParams` | `TPageParam`[] |
| <a id="pages"></a> `pages` | `TData`[] |
