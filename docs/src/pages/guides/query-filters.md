---
id: query-filters
title: Query Filters
---

Some methods within React Query accept a `QueryFilters` object. A query filter is an object with certain conditions to match a query with:

```js
// Cancel all queries
await client.cancelQueries()

// Remove all inactive queries
client.removeQueries('posts', { inactive: true })

// Refetch all active queries
await client.refetchQueries({ active: true })

// Refetch all active queries that begin with `post` in the key
await client.refetchQueries('posts', { active: true })
```

A query filter object supports the following properties:

- `exact?: boolean`
  - If you don't want to search queries inclusively by query key, you can pass the `exact: true` option to return only the query with the exact query key you have passed.
- `active?: boolean`
  - When set to `true` it will match active queries.
  - When set to `false` it will match inactive queries.
- `inactive?: boolean`
  - When set to `true` it will match inactive queries.
  - When set to `false` it will match active queries.
- `stale?: boolean`
  - When set to `true` it will match stale queries.
  - When set to `false` it will match fresh queries.
- `fresh?: boolean`
  - When set to `true` it will match fresh queries.
  - When set to `false` it will match stale queries.
- `fetching?: boolean`
  - When set to `true` it will match queries that are currently fetching.
  - When set to `false` it will match queries that are not fetching.
- `predicate?: (query: Query) => boolean`
  - This predicate function will be called for every single query in the cache and be expected to return truthy for queries that are `found`.
- `queryKey?: QueryKey`
  - Set this property to define a query key to match on.
