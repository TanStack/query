---
'@tanstack/query-core': patch
'@tanstack/react-query': patch
'@tanstack/preact-query': patch
'@tanstack/solid-query': patch
'@tanstack/svelte-query': patch
'@tanstack/vue-query': patch
'@tanstack/angular-query-experimental': patch
'@tanstack/lit-query': patch
---

Exclude `status` from the filters accepted by `QueryClient.isMutating`, `useIsMutating`, and `injectIsMutating`. These APIs always count mutations with `status: 'pending'`.
