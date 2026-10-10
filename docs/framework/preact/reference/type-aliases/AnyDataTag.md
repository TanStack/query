---
id: AnyDataTag
title: AnyDataTag
---

```ts
type AnyDataTag = object;
```

Defined in: [packages/query-core/src/types.ts:121](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L121)

Matches any type that has been tagged with [DataTag](DataTag.md), whatever its data and error types.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-datatagerrorsymbol"></a> `[dataTagErrorSymbol]` | `any` | The error type the key was tagged with. |
| <a id="property-datatagsymbol"></a> `[dataTagSymbol]` | `any` | The data type the key was tagged with. |
