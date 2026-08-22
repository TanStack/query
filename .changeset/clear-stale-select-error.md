---
'@tanstack/query-core': patch
---

fix(query-core): clear a stale `select` error when the observer switches to a query without data, and reset `isPlaceholderData` on select-error results to match the declared result types, so a previous query's select error no longer leaks into the new result
