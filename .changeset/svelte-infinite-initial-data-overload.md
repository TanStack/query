---
'@tanstack/svelte-query': minor
---

feat(svelte-query): add 'DefinedInitialDataInfiniteOptions' overload for 'createInfiniteQuery'/'infiniteQueryOptions', so `data` is typed as never `undefined` when `initialData` is set — matching the existing `createQuery`/`queryOptions` behavior
