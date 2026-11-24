---
'@tanstack/query-core': minor
'@tanstack/react-query': patch
---

Add `getServerSnapshot` to query result readers. A query that was dehydrated while its fetch was pending now renders as pending in the server render and during client hydration, even if its streamed promise resolves before the client hydrates. After hydration, the result updates to the resolved data. This fixes hydration mismatches in `useQuery`, `useInfiniteQuery` and `useQueries`. Suspense hooks are unchanged.
