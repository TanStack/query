---
'@tanstack/query-core': patch
'@tanstack/vue-query': patch
---

Export query option declaration helper types for portable Vue queryOptions factories.
The previous `useQuery`-specific initial-data helper types remain available as
`UndefinedInitialUseQueryOptions` and `DefinedInitialUseQueryOptions`.
