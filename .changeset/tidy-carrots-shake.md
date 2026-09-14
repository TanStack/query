---
'@tanstack/react-query': patch
---

Recompute `useMutationState` when `filters` or `select` change. The result was only
rebuilt when the mutation cache notified, so a render carrying new options kept
serving the previous ones until something unrelated touched the cache. `useIsMutating`
is built on the same hook and was stale in the same way.
