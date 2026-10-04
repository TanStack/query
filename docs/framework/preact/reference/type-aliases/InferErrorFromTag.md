---
id: InferErrorFromTag
title: InferErrorFromTag
---

```ts
type InferErrorFromTag<TError, TTaggedQueryKey> = TTaggedQueryKey extends DataTag<unknown, unknown, infer TaggedError> ? TaggedError extends UnsetMarker ? TError : TaggedError : TError;
```

Defined in: [packages/query-core/src/types.ts:175](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L175)

The error type tagged on a query key by [DataTag](DataTag.md), or `TError` if the key is not tagged or
was tagged without an error type.

## Type Parameters

### TError

`TError`

### TTaggedQueryKey

`TTaggedQueryKey` *extends* [`QueryKey`](QueryKey.md)
