---
'@tanstack/query-core': minor
'@tanstack/react-query': patch
---

Add `getServerSnapshot` to query result readers. For a query that `hydrate` created, it computes the result from the state the query was hydrated with, so server renders and client hydration renders show the same result even if the query changes in between, for example when a streamed promise resolves or a refetch finishes. A query that was dehydrated while pending renders as pending until hydration finishes. This fixes hydration mismatches in `useQuery`, `useInfiniteQuery` and `useQueries`. Suspense hooks are unchanged.
