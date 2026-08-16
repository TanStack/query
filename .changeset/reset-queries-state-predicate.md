---
'@tanstack/query-core': patch
---

Fix `resetQueries` so queries matched by a state-dependent filter (for example `predicate: (query) => query.state.status === 'error'`) are still refetched after `reset()` mutates their state.
