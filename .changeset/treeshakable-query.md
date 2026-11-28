---
'@tanstack/query-core': major
'@tanstack/react-query': major
'@tanstack/preact-query': major
'@tanstack/angular-query': major
'@tanstack/solid-query': major
'@tanstack/svelte-query': major
'@tanstack/vue-query': major
'@tanstack/lit-query': major
'@tanstack/query-broadcast-client-experimental': patch
'@tanstack/query-persist-client-core': patch
'@tanstack/query-devtools': patch
---

Make the ESM query core and its framework adapters treeshakable. Import client operations such as `query(client, options)`, `invalidateQueries(client, filters)`, and `getMutationCache(client)` from the adapter. A read-only client no longer needs to construct a mutation cache.

In React and Preact, pass `queryOptions`, `suspenseQueryOptions`, `infiniteQueryOptions`, or `suspenseInfiniteQueryOptions` to `useQuery`. Import result checks such as `isSuccess(result)` to narrow data or errors. Use `useQueries` and `useSuspenseQueries` for a variable number of queries.

Import `select`, `placeholderData`, `refetchInterval`, and `serialScope` where those features are used. Write `select: select((post) => post.title)` to project the observer's data while keeping the full post in the cache. Structural sharing remains enabled by default. Ordinary React and Preact queries can opt into boundaries with `throwOnError: [throwOnError, true]` or a predicate in the second position.
