---
'@tanstack/solid-query': patch
---

Ignore `observer*` query-cache notifications for `version` in `useBaseQuery` while tracking `isStale` transitions via a separate `staleVersion` signal on `observerResultsUpdated`, preventing unnecessary `select`/meta recomputes and `<Show>` child remounts when sibling observers attach, update, or unmount.
