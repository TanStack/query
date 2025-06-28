---
id: queryFeature
title: queryFeature
---

# Function: queryFeature()

```ts
function queryFeature<TFeatureKind>(kind, providers): QueryFeature<TFeatureKind>
```

Helper function to create an object that represents a Query feature.

## Type Parameters

• **TFeatureKind** _extends_ `"DeveloperTools"` \| `"PersistQueryClient"`

## Parameters

### kind

`TFeatureKind`

### providers

`Provider`[]

## Returns

[`QueryFeature`](../../interfaces/queryfeature.md)\<`TFeatureKind`\>

A Query feature.

## Defined in

[providers.ts:156](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L156)
