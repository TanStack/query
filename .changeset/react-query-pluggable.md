---
'@tanstack/query-core-pluggable': minor
'@tanstack/react-query-pluggable': minor
---

Add an experimental ESM-only pair for React. `@tanstack/react-query-pluggable` depends on `@tanstack/query-core-pluggable`. Prepare each `useQuery` call with `queryOptions`, `suspenseQueryOptions`, `infiniteQueryOptions`, or `suspenseInfiniteQueryOptions`. Each factory selects the observer and return type. The Suspense factories delegate an initial fetch to the nearest boundary.

Import optional features such as `refetchInterval`, `select`, `placeholderData`, and `serialScope` where the application uses them. Import client operations as named functions, with the client first, such as `invalidateQueries(client, filters)`. Mutation hooks acquire their cache on demand. Use `getMutationCache(client)` for direct access.
