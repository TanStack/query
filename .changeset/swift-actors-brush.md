---
'@tanstack/query-core': patch
---

fix: resetQueries now preserves the queries matched before query.reset() changes their state.
