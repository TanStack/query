---
'@tanstack/query-core': minor
'@tanstack/vue-query': minor
---

Add `queryClient.optimisticUpdate(filters, updater, options?)`. It cancels outgoing fetches for the matching queries, snapshots them, applies the updater, and resolves to a `rollback` function that restores the snapshotted state.
