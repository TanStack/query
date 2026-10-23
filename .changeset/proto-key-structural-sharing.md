---
'@tanstack/query-core': patch
---

fix(query-core): keep a `__proto__` key in query data as an own property during structural sharing, instead of changing the object's prototype
