---
id: matchQuery
title: matchQuery
---

```ts
function matchQuery(filters, query): boolean;
```

Defined in: [packages/query-core/src/utils.ts:175](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L175)

Checks whether a query matches the given [QueryFilters](../type-aliases/QueryFilters.md).
Every filter that is specified must match; filters that are left unspecified are ignored.

## Parameters

### filters

`QueryFilters`

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
