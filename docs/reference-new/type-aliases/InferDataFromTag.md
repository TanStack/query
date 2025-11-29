---
id: InferDataFromTag
title: InferDataFromTag
---

# Type Alias: InferDataFromTag\<TQueryFnData, TTaggedQueryKey\>

```ts
type InferDataFromTag<TQueryFnData, TTaggedQueryKey> = TTaggedQueryKey extends DataTag<unknown, infer TaggedValue, unknown> ? TaggedValue : TQueryFnData;
```

Defined in: [packages/query-core/src/types.ts:84](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L84)

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TTaggedQueryKey

`TTaggedQueryKey` *extends* [`QueryKey`](QueryKey.md)
