---
id: matchQuery
title: matchQuery
---

```ts
function matchQuery(filters: QueryFilters, query: Query<any, any, any, any>): boolean;
```

Defined in: [packages/query-core/src/utils.ts:201](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L201)

Checks whether a query matches the given [QueryFilters](../interfaces/QueryFilters.md).
Every filter that is specified must match; filters that are left unspecified are ignored.

## Parameters

### filters

[`QueryFilters`](../interfaces/QueryFilters.md)

The filters to check the query against.

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
