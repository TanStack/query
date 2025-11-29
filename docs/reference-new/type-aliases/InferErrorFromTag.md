---
id: InferErrorFromTag
title: InferErrorFromTag
---

# Type Alias: InferErrorFromTag\<TError, TTaggedQueryKey\>

```ts
type InferErrorFromTag<TError, TTaggedQueryKey> = TTaggedQueryKey extends DataTag<unknown, unknown, infer TaggedError> ? TaggedError extends UnsetMarker ? TError : TaggedError : TError;
```

Defined in: [packages/query-core/src/types.ts:89](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L89)

## Type Parameters

### TError

`TError`

### TTaggedQueryKey

`TTaggedQueryKey` *extends* [`QueryKey`](QueryKey.md)
