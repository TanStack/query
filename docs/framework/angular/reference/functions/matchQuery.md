---
id: matchQuery
title: matchQuery
---

```ts
function matchQuery(filters: QueryFilters, query: Query<any, any, any, any>): boolean;
```

Defined in: [packages/query-core/src/utils.ts:205](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L205)

Checks whether a query matches the given [QueryFilters](../interfaces/QueryFilters.md).
Every filter that is specified must match; filters that are left unspecified are ignored.

## Parameters

### filters

[`QueryFilters`](../interfaces/QueryFilters.md)

The filters to check the query against.

<a id="filters-properties"></a>

#### `filters` properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="filters-property-exact"></a> `exact?` | `boolean` | `undefined` | Match query key exactly |
| <a id="filters-property-fetchstatus"></a> `fetchStatus?` | `"fetching"` \| `"paused"` \| `"idle"` | `undefined` | Include queries matching their fetchStatus |
| <a id="filters-property-predicate"></a> `predicate?` | (`query`: [`Query`](../classes/Query.md)) => `boolean` | `undefined` | Include queries matching this predicate function |
| <a id="filters-property-querykey"></a> `queryKey?` | `TQueryKey` \| `TuplePrefixes`\<`TQueryKey`\> | `undefined` | Include queries matching this query key |
| <a id="filters-property-stale"></a> `stale?` | `boolean` | `undefined` | Include or exclude stale queries |
| <a id="filters-property-type"></a> `type?` | `QueryTypeFilter` | `'all'` | Filter to active queries, inactive queries or all queries |

### query

[`Query`](../classes/Query.md)\<`any`, `any`, `any`, `any`\>

The query to check.

## Returns

`boolean`

`true` if the query matches every specified filter.

## Example

```ts
const queryCache = queryClient.getQueryCache()

const matchingQueries = queryCache
  .getAll()
  .filter((query) => matchQuery({ queryKey: ['posts'] }, query))
```
