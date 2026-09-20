---
id: QueryKeyWithDataTag
title: QueryKeyWithDataTag
---

```ts
type QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError> = object;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:37

## Type Parameters

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

## Properties

| Property | Type |
| ------ | ------ |
| <a id="querykey"></a> `queryKey` | [`DataTag`](DataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\> |
