---
'@tanstack/svelte-query': patch
---

Fix `createQueries` crashing with `TypeError: 'deleteProperty' on proxy: trap returned falsish for property 'N'` when two or more items were removed from its reactive array in the same update.
