---
'@tanstack/solid-query': patch
---

Fix `useQueries`/`createQueries` rejecting a `combine` function that returns a shape other than the results array, which previously failed to type check and threw `state.map is not a function` at runtime.
