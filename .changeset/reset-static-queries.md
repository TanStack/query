---
'@tanstack/query-core': patch
---

fix(query-core): only skip static queries in `refetchQueries` when they already have data, so `resetQueries`, `invalidateQueries` and `refetchQueries` refetch an active static query that has no data (for example after a reset or a failed first fetch)
