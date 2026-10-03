---
id: DataTag
title: DataTag
---

```ts
type DataTag<TType, TValue, TError> = TType extends AnyDataTag ? TType : TType & object;
```

Defined in: [packages/query-core/src/types.ts:130](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L130)

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
