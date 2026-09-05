---
id: queryFeature
title: queryFeature
---

```ts
function queryFeature<TFeatureKind>(kind, providers): QueryFeature<TFeatureKind>;
```

Defined in: [providers.ts:143](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L143)

Helper function to create an object that represents a Query feature.

## Type Parameters

### TFeatureKind

`TFeatureKind` *extends* `"Devtools"` \| `"PersistQueryClient"`

## Parameters

### kind

`TFeatureKind`

The kind of feature, e.g. `'Devtools'`.

### providers

`Provider`[]

The Angular providers this feature contributes to `provideTanStackQuery`.

## Returns

[`QueryFeature`](../interfaces/QueryFeature.md)\<`TFeatureKind`\>

A Query feature.
