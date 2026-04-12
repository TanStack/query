---
id: queryFeature
title: queryFeature
---

# Function: queryFeature()

```ts
function queryFeature<TFeatureKind>(kind, providers): QueryFeature<TFeatureKind>;
```

Defined in: [providers.ts:199](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L199)

Helper function to create an object that represents a Query feature.

## Type Parameters

### TFeatureKind

`TFeatureKind` *extends* `"Hydration"` \| `"Devtools"` \| `"PersistQueryClient"`

## Parameters

### kind

`TFeatureKind`

### providers

`Provider`[]

## Returns

[`QueryFeature`](../interfaces/QueryFeature.md)\<`TFeatureKind`\>

A Query feature.
