---
'@tanstack/angular-query-experimental': patch
'@tanstack/preact-query': patch
'@tanstack/react-query': patch
'@tanstack/solid-query': patch
'@tanstack/svelte-query': patch
'@tanstack/vue-query': patch
---

Fix `queryOptions` and `infiniteQueryOptions` return types so exported inferred options can be emitted in declaration files without leaking internal data tag symbols.
