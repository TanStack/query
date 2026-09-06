---
id: InferDataFromTag
title: InferDataFromTag
---

```ts
type InferDataFromTag<TQueryFnData, TTaggedQueryKey> = TTaggedQueryKey extends DataTag<unknown, infer TaggedValue, unknown> ? TaggedValue : TQueryFnData;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:40

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TTaggedQueryKey

`TTaggedQueryKey` *extends* [`QueryKey`](QueryKey.md)
