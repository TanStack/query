---
'@tanstack/query-core': minor
'@tanstack/react-query': minor
---

feat: add experimental query handles. `experimental_prefetchHandle`, `experimental_ensureHandle` and `experimental_fetchHandle` start a query from a query factory and return a small serializable handle. `experimental_fromHandle` rebuilds the query's options from a handle. `experimental_waterfallHandle` builds a handle for an input known only during render, and the component that reads it starts the query.
