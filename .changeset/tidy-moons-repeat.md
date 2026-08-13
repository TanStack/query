---
'@tanstack/angular-query-experimental': patch
---

Register the Angular pending task when `mutate` is called, so `whenStable()` no longer resolves while the mutation is still running
