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

Move error boundary options out of query-core. React, Preact, Solid, and Vue still accept `throwOnError` in their adapter options and client defaults. Import `QueryClient` from the adapter to configure those defaults. Imperative refetch methods still accept `throwOnError` to control promise rejection.

Query observers now notify listeners whenever the result's error changes, even when `notifyOnChangeProps` is `'none'` or the component does not track `error`.
