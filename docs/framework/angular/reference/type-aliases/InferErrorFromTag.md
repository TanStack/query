---
id: InferErrorFromTag
title: InferErrorFromTag
---

```ts
type InferErrorFromTag<TError, TTaggedQueryKey> = TTaggedQueryKey extends DataTag<unknown, unknown, infer TaggedError> ? TaggedError extends UnsetMarker ? TError : TaggedError : TError;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:41

## Type Parameters

### TError

`TError`

### TTaggedQueryKey

`TTaggedQueryKey` *extends* [`QueryKey`](QueryKey.md)
