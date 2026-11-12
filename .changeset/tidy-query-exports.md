---
'@tanstack/query-core': patch
'@tanstack/query-persist-client-core': patch
'@tanstack/angular-query-experimental': patch
'@tanstack/angular-query-persist-client': patch
'@tanstack/preact-query': patch
'@tanstack/preact-query-persist-client': patch
'@tanstack/react-query': patch
'@tanstack/react-query-persist-client': patch
'@tanstack/solid-query': patch
'@tanstack/solid-query-persist-client': patch
'@tanstack/svelte-query': patch
'@tanstack/svelte-query-persist-client': patch
---

Replace star exports with explicit exports while preserving the current public API. Adapters continue to re-export all of query-core.
