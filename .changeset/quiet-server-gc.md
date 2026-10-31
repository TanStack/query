---
'@tanstack/query-core': patch
---

fix(query-core): do not schedule garbage collection timers on the server, even with an explicit 'gcTime'
