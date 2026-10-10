---
'@tanstack/query-core': minor
'@tanstack/react-query': minor
'@tanstack/preact-query': minor
'@tanstack/solid-query': minor
'@tanstack/svelte-query': minor
'@tanstack/vue-query': minor
'@tanstack/angular-query-experimental': minor
'@tanstack/lit-query': minor
---

Support imperative infinite pagination with `mode: 'manual'`. Manual fetches require a typed page parameter, and refetches reuse the cached parameters. Preserve the mode through options helpers, framework results, and Suspense. Automatic queries continue to use page parameter getters.
