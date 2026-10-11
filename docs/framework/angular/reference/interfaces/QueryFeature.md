---
id: QueryFeature
title: QueryFeature
---

Defined in: [packages/angular-query-experimental/src/providers.ts:126](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L126)

Helper type to represent a Query feature.

## Type Parameters

### TFeatureKind

`TFeatureKind` *extends* `QueryFeatureKind`

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-ɵkind"></a> `ɵkind` | `TFeatureKind` | The kind of the feature, e.g. `'Devtools'` or `'PersistQueryClient'`. |
| <a id="property-ɵproviders"></a> `ɵproviders` | `Provider`[] | The providers that `provideTanStackQuery` registers for the feature. |
