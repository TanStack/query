---
'@tanstack/vue-query': patch
---

fix(vue-query): preserve discriminated union narrowing in `UseBaseQueryReturnType`

Make the mapped type explicitly distributive over each variant of `QueryObserverResult`, and document the narrowing patterns that work without `reactive()` (direct `data.value !== undefined` checks) versus those that require `reactive()` (narrowing via `isSuccess`/`status`). Adds type-test coverage for the issue scenario.
