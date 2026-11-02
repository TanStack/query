---
'@tanstack/query-core': minor
---

Fix `setQueryData` no-op skip for structurally identical data (#12443)

- Skip dispatching `success` event when manual write result is referentially identical
- Avoids unnecessary broadcast client posts and persist client writes
- Preserves fetch path behavior (non-manual writes still dispatch)
- Explicit `updatedAt` option still triggers dispatch
- Adds comprehensive tests