---
id: DataTag
title: DataTag
---

```ts
type DataTag<TType, TValue, TError> = TType extends AnyDataTag ? TType : TType & object;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:33

## Type Parameters

### TType

`TType`

### TValue

`TValue`

### TError

`TError` = [`UnsetMarker`](UnsetMarker.md)
