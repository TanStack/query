---
id: QueryKeyWithDataTag
title: QueryKeyWithDataTag
---

```ts
type QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError> = object;
```

Defined in: [packages/query-core/src/types.ts:109](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L109)

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
