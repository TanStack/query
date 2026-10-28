---
'@tanstack/query-core': patch
---

Preserve own `__proto__` properties when hashing query keys and sharing query data. This prevents distinct JSON query keys from sharing a cache entry and keeps data properties from changing the returned object's prototype.
