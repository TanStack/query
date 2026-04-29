---
'@tanstack/svelte-query': patch
---

fix(svelte-query): wrap `TData` in `NoInfer` on `createQuery` and `createInfiniteQuery` return types so `TData` is inferred from the input options only (matching `react-query`, `preact-query`, and `vue-query`). Prevents the result-type annotation from silently widening `TData` and improves `select` inference (#7673).
