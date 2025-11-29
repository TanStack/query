---
id: queryFeature
title: queryFeature
---

# Function: queryFeature()

```ts
function queryFeature<TFeatureKind>(kind, providers): QueryFeature<TFeatureKind>;
```

Defined in: [providers.ts:146](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L146)

Helper function to create an object that represents a Query feature.

## Type Parameters

### TFeatureKind

`TFeatureKind` *extends* `"Devtools"` \| `"PersistQueryClient"`

## Parameters

### kind

`TFeatureKind`

### providers

`Provider`[]

## Returns

[`QueryFeature`](../../interfaces/QueryFeature.md)\<`TFeatureKind`\>

A Query feature.
