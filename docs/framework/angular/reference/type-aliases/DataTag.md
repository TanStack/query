---
id: DataTag
title: DataTag
---

```ts
type DataTag<TType, TValue, TError> = TType extends AnyDataTag ? TType : TType & object;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:99

Tags `TType` (usually a query key) with a data type and an optional error type, so that APIs that
receive it, like `queryClient.getQueryData`, can infer them. A type that is already tagged is
returned as is.

## Type Parameters

### TType

`TType`

### TValue

`TValue`

### TError

`TError` = [`UnsetMarker`](UnsetMarker.md)
