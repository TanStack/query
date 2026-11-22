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

Require `queryFn` in query observers, hooks, composables, controllers, and options helpers. Pass `queryFn: defaultQueryFn` to use the function from the client defaults. Pass `queryFn: skipToken` for a query without a fetch function where the API supports it.
