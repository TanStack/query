---
'@tanstack/query-core': patch
---

Fix: Ensure queries refetch on mount or retry when in error state, even if data is not stale.
