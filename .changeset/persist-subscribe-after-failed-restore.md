---
'@tanstack/query-persist-client-core': patch
---

Subscribe to cache changes in `persistQueryClient` even when restoring fails, so a failed restore (e.g. a corrupted persisted cache) no longer stops the cache from being persisted for the rest of the session.
