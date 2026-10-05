---
id: QueryKeyWithDataTag
title: QueryKeyWithDataTag
---

```ts
type QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError> = {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>;
};
```

Defined in: [packages/query-core/src/types.ts:151](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L151)

An object whose `queryKey` is tagged with [DataTag](DataTag.md), like the options returned by
`queryOptions`.

## Type Parameters

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-querykey"></a> `queryKey` | [`DataTag`](DataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\> | The query key, tagged with the query's data and error types. |
