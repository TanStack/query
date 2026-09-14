---
id: InferErrorFromTag
title: InferErrorFromTag
---

```ts
type InferErrorFromTag<TError, TTaggedQueryKey> = TTaggedQueryKey extends DataTag<unknown, unknown, infer TaggedError> ? TaggedError extends UnsetMarker ? TError : TaggedError : TError;
```

Defined in: [packages/query-core/src/types.ts:95](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L95)

## Type Parameters

### TError

`TError`

### TTaggedQueryKey

`TTaggedQueryKey` *extends* [`QueryKey`](QueryKey.md)
