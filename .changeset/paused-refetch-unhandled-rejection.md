---
'@tanstack/query-core': patch
---

Handle the rejection of a paused refetch started by `refetchQueries` with `throwOnError`, so cancelling it later no longer causes an unhandled `CancelledError`.
