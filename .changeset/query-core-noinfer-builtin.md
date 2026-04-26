---
'@tanstack/query-core': patch
'@tanstack/vue-query': patch
---

fix(query-core): use TypeScript's built-in `NoInfer` so `NoInfer<X[K]>` stays assignable to `X[K]` in generic contexts (fixes #9937)
