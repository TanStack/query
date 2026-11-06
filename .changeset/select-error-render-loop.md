---
'@tanstack/query-core': patch
---

Keep the observer result stable when `select` throws the same error again, so an inline selector no longer forces a render loop.
