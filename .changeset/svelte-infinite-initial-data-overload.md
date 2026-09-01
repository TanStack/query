---
'@tanstack/svelte-query': minor
---

Add a `createInfiniteQuery`/`infiniteQueryOptions` overload selected when `initialData` is set, so `data` is typed as never `undefined` — matching the existing `createQuery`/`queryOptions` behavior.
