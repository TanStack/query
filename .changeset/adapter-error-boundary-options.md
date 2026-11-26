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

Query observers now notify listeners when the result's error changes, even when the component does not track `error`. Set `notifyOnChangeProps: 'none'` to suppress all notifications and opt out of the query's `throwOnError` boundary handling.

In React and Preact, `useQueries` skips `combine` when a query error needs to reach the error boundary.
