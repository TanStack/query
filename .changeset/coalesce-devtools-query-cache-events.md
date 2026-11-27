---
'@tanstack/query-devtools': patch
---

fix(query-devtools): coalesce query cache events per microtask to update the list once on 'clear' and 'removeQueries'
