---
'@tanstack/query-core': patch
---

Fix per-call mutate `onSettled` receiving another mutation's result when `mutate()` is called from `onSuccess` or `onError`.
