---
id: filters
title: Filters
---

Some methods within React Query accept a `QueryFilters` or `MutationFilters` object.

## `Query Filters`

A query filter is an object with certain conditions to match a query with:

```js
// Cancel all queries
await queryClient.cancelQueries()

// Remove all inactive queries that begin with `posts` in the key
queryClient.removeQueries('posts', { inactive: true })

// Refetch all active queries
await queryClient.refetchQueries({ active: true })

// Refetch all active queries that begin with `posts` in the key
await queryClient.refetchQueries('posts', { active: true })
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
- `fetching?: boolean`
  - When set to `true` it will match queries that are currently fetching.
  - When set to `false` it will match queries that are not fetching.
- `predicate?: (query: Query) => boolean`
  - This predicate function will be called for every single query in the cache and be expected to return truthy for queries that are `found`.
- `queryKey?: QueryKey`
  - Set this property to define a query key to match on.

## `Mutation Filters`

A mutation filter is an object with certain conditions to match a mutation with:

```js
// Get the number of all fetching mutations
await queryClient.isMutating()

// Filter mutations by mutationKey
await queryClient.isMutating({ mutationKey: "post" })

// Filter mutations using a predicate function
await queryClient.isMutating({ predicate: (mutation) => mutation.options.variables?.id === 1 })
```

A mutation filter object supports the following properties:

- `exact?: boolean`
  - If you don't want to search mutations inclusively by mutation key, you can pass the `exact: true` option to return only the mutation with the exact mutation key you have passed.
- `fetching?: boolean`
  - When set to `true` it will match mutations that are currently fetching.
  - When set to `false` it will match mutations that are not fetching.
- `predicate?: (mutation: Mutation) => boolean`
  - This predicate function will be called for every single mutation in the cache and be expected to return truthy for mutations that are `found`.
- `mutationKey?: MutationKey`
  - Set this property to define a mutation key to match on.
