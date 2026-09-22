---
id: QueryFilters
title: QueryFilters
---

Defined in: packages/query-core/dist-ts/src/utils.d.ts:13

Filters used to select queries, for example in `queryClient.getQueriesData` or `queryClient.invalidateQueries`.
All provided filters must match; filters that are left unspecified are ignored.

## Extended by

- [`InvalidateQueryFilters`](InvalidateQueryFilters.md)
- [`RefetchQueryFilters`](RefetchQueryFilters.md)

## Type Parameters

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](../type-aliases/QueryKey.md) = [`QueryKey`](../type-aliases/QueryKey.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="exact"></a> `exact?` | `boolean` | Match query key exactly |
| <a id="fetchstatus"></a> `fetchStatus?` | [`FetchStatus`](../type-aliases/FetchStatus.md) | Include queries matching their fetchStatus |
| <a id="predicate"></a> `predicate?` | (`query`: [`Query`](../classes/Query.md)) => `boolean` | Include queries matching this predicate function |
| <a id="querykey"></a> `queryKey?` | `TQueryKey` \| `TuplePrefixes`\<`TQueryKey`\> | Include queries matching this query key |
| <a id="stale"></a> `stale?` | `boolean` | Include or exclude stale queries |
| <a id="type"></a> `type?` | `QueryTypeFilter` | Filter to active queries, inactive queries or all queries Defaults to `'all'`. |
