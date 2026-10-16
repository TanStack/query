---
id: InferDataFromTag
title: InferDataFromTag
---

```ts
type InferDataFromTag<TQueryFnData, TTaggedQueryKey> = TTaggedQueryKey extends DataTag<unknown, infer TaggedValue, unknown> ? TaggedValue : TQueryFnData;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:117

The data type tagged on a query key by [DataTag](DataTag.md), or `TQueryFnData` if the key is not
tagged.

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TTaggedQueryKey

`TTaggedQueryKey` *extends* [`QueryKey`](QueryKey.md)
