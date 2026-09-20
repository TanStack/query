---
id: matchQuery
title: matchQuery
---

```ts
function matchQuery(filters: QueryFilters, query: Query<any, any, any, any>): boolean;
```

Defined in: packages/query-core/dist-ts/src/utils.d.ts:106

Checks whether a query matches the given [QueryFilters](../interfaces/QueryFilters.md).
Every filter that is specified must match; filters that are left unspecified are ignored.

## Parameters

### filters

[`QueryFilters`](../interfaces/QueryFilters.md)

### query

[`Query`](../classes/Query.md)\<`any`, `any`, `any`, `any`\>

## Returns

`boolean`

## Example

```ts
const queryCache = queryClient.getQueryCache()

const matchingQueries = queryCache
  .getAll()
  .filter((query) => matchQuery({ queryKey: ['posts'] }, query))
```
