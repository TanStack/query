---
'@tanstack/query-core': patch
---

Preserve own `__proto__` properties when hashing query keys so distinct JSON query keys do not share a cache entry.
