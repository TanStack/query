---
id: DataTag
title: DataTag
---

```ts
type DataTag<TType, TValue, TError> = TType extends AnyDataTag ? TType : TType & object;
```

Defined in: [packages/query-core/src/types.ts:71](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L71)

## Type Parameters

### TType

`TType`

### TValue

`TValue`

### TError

`TError` = [`UnsetMarker`](UnsetMarker.md)
