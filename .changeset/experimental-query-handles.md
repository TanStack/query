---
'@tanstack/query-core': minor
'@tanstack/react-query': minor
---

feat: add experimental query handles. `experimental_prefetchHandle`, `experimental_ensureHandle` and `experimental_fetchHandle` start a query from a query factory and return a small serializable handle, `experimental_fromHandle` rebuilds the query's options from it, and `experimental_useWaterfall` starts a query from a component.
