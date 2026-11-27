---
'@tanstack/query-types': minor
'@tanstack/query-core': patch
'@tanstack/react-query-no-core': minor
'@tanstack/react-query-no-core-pluggable': minor
---

Add experimental ESM React Query adapters with an integrated query runtime. The pluggable adapter lets apps import polling, selection, placeholder data, and scoped mutation queues at the point of use. It also exports imperative infinite queries and bulk cache operations as standalone functions. Both adapters and `@tanstack/query-core` share TypeScript definitions through `@tanstack/query-types`.
