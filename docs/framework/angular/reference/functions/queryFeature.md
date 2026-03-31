---
id: queryFeature
title: queryFeature
---

# Function: queryFeature()

```ts
function queryFeature<TFeatureKind>(kind, providers): QueryFeature<TFeatureKind>;
```

Defined in: [providers.ts:150](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L150)

Helper function to create an object that represents a Query feature.

## Type Parameters

### TFeatureKind

`TFeatureKind` *extends* `QueryFeatureKind`

## Parameters

### kind

`TFeatureKind`

The feature kind identifier.

### providers

`EnvironmentProviders`

The providers contributed by the feature.

## Returns

[`QueryFeature`](../interfaces/QueryFeature.md)\<`TFeatureKind`\>

A Query feature.
