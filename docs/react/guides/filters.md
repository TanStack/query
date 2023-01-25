---
id: filters
title: Filters
---

Some methods within TanStack Query accept a `QueryFilters` or `MutationFilters` object.

## `Query Filters`

A query filter is an object with certain conditions to match a query with:

```tsx
// Cancel all queries
await queryClient.cancelQueries()

// Remove all inactive queries that begin with `posts` in the key
queryClient.removeQueries({ queryKey: ['posts'], type: 'inactive' })

// Refetch all active queries
await queryClient.refetchQueries({ type: 'active' })

// Refetch all active queries that begin with `posts` in the key
await queryClient.refetchQueries({ queryKey: ['posts'], type: 'active' })
```

A query filter object supports the following properties:

- `queryKey?: QueryKey`
  - Set this property to define a query key to match on.
- `exact?: boolean`
  - If you don't want to search queries inclusively by query key, you can pass the `exact: true` option to return only the query with the exact query key you have passed.
- `type?: 'active' | 'inactive' | 'all'`
  - Defaults to `all`
  - When set to `active` it will match active queries.
  - When set to `inactive` it will match inactive queries.
- `stale?: boolean`
  - When set to `true` it will match stale queries.
  - When set to `false` it will match fresh queries.
- `fetchStatus?: FetchStatus`
  - When set to `fetching` it will match queries that are currently fetching.
  - When set to `paused` it will match queries that wanted to fetch, but have been `paused`.
  - When set to `idle` it will match queries that are not fetching.
- `predicate?: (query: Query) => boolean`
  - This predicate function will be used as a final filter on all matching queries. If no other filters are specified, this function will be evaluated against every query in the cache.

## `Mutation Filters`

A mutation filter is an object with certain conditions to match a mutation with:

```tsx
// Get the number of all fetching mutations
await queryClient.isMutating()

// Filter mutations by mutationKey
await queryClient.isMutating({ mutationKey: ["post"] })

// Filter mutations using a predicate function
await queryClient.isMutating({
  predicate: (mutation) => mutation.options.variables?.id === 1,
})
```

A mutation filter object supports the following properties:

- `mutationKey?: MutationKey`
  - Set this property to define a mutation key to match on.
- `exact?: boolean`
  - If you don't want to search mutations inclusively by mutation key, you can pass the `exact: true` option to return only the mutation with the exact mutation key you have passed.
- `fetching?: boolean`
  - When set to `true` it will match mutations that are currently fetching.
  - When set to `false` it will match mutations that are not fetching.
- `predicate?: (mutation: Mutation) => boolean`
  - This predicate function will be used as a final filter on all matching mutations. If no other filters are specified, this function will be evaluated against every mutation in the cache.
