---
'@tanstack/solid-query': patch
---

fix(solid-query): allow `combine` to return a custom result shape from `useQueries` / `createQueries`, matching the behavior of the React adapter. Relaxed the `TCombinedResult` generic from `extends QueriesResults<T>` to `extends object`, so a `combine` callback can return any object literal (e.g. `{ data: boolean }`) instead of being constrained to the array of per-query results (#7522).
