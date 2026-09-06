---
id: InferDataFromTag
title: InferDataFromTag
---

```ts
type InferDataFromTag<TQueryFnData, TTaggedQueryKey> = TTaggedQueryKey extends DataTag<unknown, infer TaggedValue, unknown> ? TaggedValue : TQueryFnData;
```

Defined in: [packages/query-core/src/types.ts:90](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L90)

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TTaggedQueryKey

`TTaggedQueryKey` *extends* [`QueryKey`](QueryKey.md)
