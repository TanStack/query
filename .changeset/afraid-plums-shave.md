---
'@tanstack/angular-query-experimental': patch
---

Register the Angular pending task as soon as a query subscription starts a fetch, so `whenStable()` no longer resolves while the query is still loading
