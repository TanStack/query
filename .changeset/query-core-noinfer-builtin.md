---
'@tanstack/query-core': patch
'@tanstack/vue-query': patch
---

fix(query-core): drop the custom `NoInfer<T>` re-export and rely on TypeScript's built-in `NoInfer` (TS ≥ 5.4) so `NoInfer<X[K]>` stays assignable to `X[K]` in generic contexts (fixes #9937)
