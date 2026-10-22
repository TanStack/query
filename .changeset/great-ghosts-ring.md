---
"@tanstack/query-core": patch
---

Honour explicit `fetchStatus` filters in `QueryClient.isFetching` and framework fetching counters. Passing `'paused'` or `'idle'` now counts queries in that status; omitted or `undefined` values still default to `'fetching'`.
