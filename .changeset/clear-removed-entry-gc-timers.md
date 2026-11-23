---
'@tanstack/query-core': patch
---

Clear garbage collection timers when cache entries are removed and prevent later fetch or observer cleanup from starting new timers for those entries.
