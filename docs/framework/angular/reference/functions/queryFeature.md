---
id: queryFeature
title: queryFeature
---

# Function: queryFeature()

```ts
function queryFeature<TFeatureKind>(kind, providers): QueryFeature<TFeatureKind>;
```

Defined in: [providers.ts:200](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L200)

Helper function to create an object that represents a Query feature.

## Type Parameters

### TFeatureKind

`TFeatureKind` *extends* `"Hydration"` \| `"Devtools"` \| `"PersistQueryClient"`

## Parameters

### kind

`TFeatureKind`

### providers

`EnvironmentProviders` | (`Provider` \| `EnvironmentProviders`)[]

## Returns

[`QueryFeature`](../interfaces/QueryFeature.md)\<`TFeatureKind`\>

A Query feature.
