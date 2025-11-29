---
id: DataTag
title: DataTag
---

# Type Alias: DataTag\<TType, TValue, TError\>

```ts
type DataTag<TType, TValue, TError> = TType extends AnyDataTag ? TType : TType & object;
```

Defined in: [packages/query-core/src/types.ts:73](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L73)

## Type Parameters

### TType

`TType`

### TValue

`TValue`

### TError

`TError` = [`UnsetMarker`](UnsetMarker.md)
