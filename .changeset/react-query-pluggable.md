---
'@tanstack/query-core-pluggable': minor
'@tanstack/react-query-pluggable': minor
---

Add an experimental ESM-only pair for React. `@tanstack/react-query-pluggable` depends on `@tanstack/query-core-pluggable`. Prepare each `useQuery` call with `queryOptions`, `suspenseQueryOptions`, `infiniteQueryOptions`, or `suspenseInfiniteQueryOptions`. Each factory selects the observer and return type. The Suspense factories delegate an initial fetch to the nearest boundary.

Import optional features such as `refetchInterval`, `select`, `placeholderData`, and `serialScope` where the application uses them. Call the v6 imperative readers as `query(client, options)` and `infiniteQuery(client, options)`. Both use fresh cached data and fetch when stale. Other client operations follow the same client-first convention, including `invalidateQueries(client, filters)`. Mutation hooks acquire their cache on demand. Use `getMutationCache(client)` for direct access.

The single-query reader gets its render behavior from the factory. Import result predicates such as `isSuccess(result)`, `isLoading(result)`, and `isFetchingNextPage(result)` wherever a component needs them. They narrow the result for TypeScript. Use `countFetchingQueries(client)` to count fetching queries across a cache. For a variable-length list, use `useQueries` or `useSuspenseQueries`.

Cache-wide lookups and query-state checks are named imports, including `findCachedQuery(cache, filters)`, `findCachedQueries(cache, filters)`, `clearQueryCache(cache)`, and `isQueryActive(query)`.

Four methods on an individual cache entry are now named imports. Use `invalidateCachedQuery(entry)` to mark it invalidated, `resetCachedQuery(entry)` to cancel its fetch and restore its initial state, `getQueryObserverCount(entry)` to count subscribed observers, and `isQueryFetched(entry)` to check for a data or error update. For a filtered operation that also refetches eligible active queries by default, use `invalidateQueries(client, filters)` or `resetQueries(client, filters)`. Inside a component, `isFetched(result)` reads the update history from the hook result.

Ordinary readers handle failures inline by default. Import `throwOnError` and set `throwOnError: [throwOnError, true]` or `throwOnError: [throwOnError, predicate]` to opt into React error boundaries. Suspense readers include boundary handling automatically. Ordinary queries retain default structural sharing. The infinite query fetcher prepares page requests only when the application uses pagination.
