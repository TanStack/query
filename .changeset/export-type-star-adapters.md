---
'@tanstack/preact-query': patch
'@tanstack/solid-query': patch
'@tanstack/svelte-query': patch
'@tanstack/angular-query-experimental': patch
---

fix({preact,solid,svelte,angular-query-experimental}): switch to 'export type *' for type-only re-exports, matching #11228 for React Query
