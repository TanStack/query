---
'@tanstack/query-core-pluggable': minor
'@tanstack/react-query-pluggable': minor
---

Add an experimental ESM-only pair for React. `@tanstack/react-query-pluggable` depends on `@tanstack/query-core-pluggable`. Prepare each `useQuery` call with `queryOptions`, `suspenseQueryOptions`, `infiniteQueryOptions`, or `suspenseInfiniteQueryOptions`. Each factory selects the observer and return type. The Suspense factories delegate an initial fetch to the nearest boundary.

Import optional features such as `refetchInterval`, `select`, `placeholderData`, and `serialScope` where the application uses them. Call the v6 imperative readers as `query(client, options)` and `infiniteQuery(client, options)`. Both use fresh cached data and fetch when stale. Other client operations follow the same client-first convention, including `invalidateQueries(client, filters)`. Mutation hooks acquire their cache on demand. Use `getMutationCache(client)` for direct access.

The single-query reader gets its render behavior from the factory. Import result predicates such as `isSuccess(result)`, `isLoading(result)`, and `isFetchingNextPage(result)` wherever a component needs them. They narrow the result for TypeScript. Use `countFetchingQueries(client)` to count fetching queries across a cache. For a variable-length list, use `useQueries` or `useSuspenseQueries`.

Cache-wide lookups and query-state checks are named imports, including `findCachedQuery(cache, filters)`, `findCachedQueries(cache, filters)`, `clearQueryCache(cache)`, and `isQueryActive(query)`.

Ordinary readers handle failures inline by default. Import `throwOnError` and set `throwOnError: [throwOnError, true]` or `throwOnError: [throwOnError, predicate]` to opt into React error boundaries. Suspense readers include boundary handling automatically. Ordinary queries retain default structural sharing. The infinite query fetcher prepares page requests only when the application uses pagination.
