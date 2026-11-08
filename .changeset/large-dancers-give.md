---
'@tanstack/query-core': patch
---

Release garbage collection timers when cache entries are removed, and avoid scheduling new timers for removed queries or mutations after cancellation or observer cleanup. Pending mutations continue to execute normally.
