---
id: InferDataFromTag
title: InferDataFromTag
---

```ts
type InferDataFromTag<TQueryFnData, TTaggedQueryKey> = TTaggedQueryKey extends DataTag<unknown, infer TaggedValue, unknown> ? TaggedValue : TQueryFnData;
```

Defined in: [packages/query-core/src/types.ts:167](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L167)

The data type tagged on a query key by [DataTag](DataTag.md), or `TQueryFnData` if the key is not
tagged.

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TTaggedQueryKey

`TTaggedQueryKey` *extends* [`QueryKey`](QueryKey.md)
