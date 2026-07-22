---
'@tanstack/query-core': patch
---

Fix `resetQueries` not refetching queries selected by a state-dependent filter (e.g. `predicate: (query) => query.state.status === 'error'`). `resetQueries` reset the matched queries first — mutating their status (`error` → `pending`) — and then re-ran the same filter to choose refetch targets, so the now-changed queries no longer matched and were never refetched. The matched queries are now snapshotted before the reset and refetched directly.
