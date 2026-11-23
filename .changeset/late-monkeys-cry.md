---
'@tanstack/angular-query': major
'@tanstack/lit-query': major
'@tanstack/preact-query': major
'@tanstack/query-core': major
'@tanstack/react-query': major
'@tanstack/solid-query': major
'@tanstack/svelte-query': major
'@tanstack/vue-query': major
---

Use the exported `getMutationCache(queryClient)` function in place of `queryClient.getMutationCache()`. The core client creates the default mutation cache on first access, so query-only bundles can omit the cache implementation. A custom cache supplied to the client is still used. Mutation scope operations use the existing scope index with a simpler lookup and removal path.
