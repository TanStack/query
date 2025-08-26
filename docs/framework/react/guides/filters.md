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
await queryClient.isMutating({ mutationKey: ['post'] })

// Filter mutations using a predicate function
await queryClient.isMutating({
  predicate: (mutation) => mutation.state.variables?.id === 1,
})
```

A mutation filter object supports the following properties:

- `mutationKey?: MutationKey`
  - Set this property to define a mutation key to match on.
- `exact?: boolean`
  - If you don't want to search mutations inclusively by mutation key, you can pass the `exact: true` option to return only the mutation with the exact mutation key you have passed.
- `status?: MutationStatus`
  - Allows for filtering mutations according to their status.
- `predicate?: (mutation: Mutation) => boolean`
  - This predicate function will be used as a final filter on all matching mutations. If no other filters are specified, this function will be evaluated against every mutation in the cache.

## `Cancel Options`

Cancel options are used to control the behavior of query cancellation operations.

// Cancel all queries silently (no CancelledError thrown)
await queryClient.cancelQueries(undefined, { silent: true })

// Cancel specific queries with revert option
await queryClient.cancelQueries(
  { queryKey: ['posts'] },
  { revert: true, silent: true }
)

A cancel options object supports the following properties:

- `silent?: boolean`
  - When set to `true`, prevents `CancelledError` from being thrown during query cancellation.
  - Defaults to `false`
  - Useful when you want to cancel queries without handling cancellation errors.
- `revert?: boolean`
  - When set to `true`, reverts the query to its previous state before cancellation.
  - Defaults to `true`

## Utils

### `matchQuery`

```tsx
const isMatching = matchQuery(filters, query)
```

Returns a boolean that indicates whether a query matches the provided set of query filters.

### `matchMutation`

```tsx
const isMatching = matchMutation(filters, mutation)
```

Returns a boolean that indicates whether a mutation matches the provided set of mutation filters.
