---
'@tanstack/query-core': minor
'@tanstack/react-query-pluggable': minor
---

Add an experimental ESM-only React Query adapter backed by `@tanstack/query-core`. Apps can import polling, selection, placeholder data, and serial mutation queues where they use them. Use `useQuery(query(options))` for a regular read and `useQuery(suspenseQuery(options))` to suspend on the same cache. Compose `infiniteQuery(options)` with the same hook and Suspense policy to read pages. For imperative fetching, import `fetchInfiniteQuery(client, options)`. Client operations are named functions with the client as their first argument, including `getQueryData(client, key)` and `invalidateQueries(client, filters)`.

Mutation hooks acquire a cache on first use. For direct access, import `getMutationCache` and call `getMutationCache(client)`. Clients configured with a custom cache return that instance.
