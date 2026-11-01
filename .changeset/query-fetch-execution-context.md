---
'@tanstack/query-core': major
'@tanstack/query-devtools': patch
'@tanstack/query-persist-client-core': patch
'@tanstack/vue-query': patch
---

Bind queries to their cache and each fetch execution to its initiating client. This supports clients that share a query cache without retaining the client that first created a query.

`Query.fetch` now requires the initiating `QueryClient` as its first argument. Direct `Query` construction accepts `cache` instead of `client` and no longer accepts creator-specific `defaultOptions`.

Each new execution captures its query options and keeps the same client, query function, metadata, persister, and infinite page configuration through retries. A missing query function can still become available later, but an existing function cannot be replaced during the execution. Callers that join a fetch share its context. The snapshot is shallow and does not clone application objects.

Queries no longer merge their creating client's defaults into replacement options. Calls without new options still reuse the latest cached configuration.
