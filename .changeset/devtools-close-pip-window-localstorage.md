---
'@tanstack/query-devtools': patch
---

fix(query-devtools/PiPContext): reset 'pip_open' in 'localStore' from 'closePipWindow' so the auto-open createEffect does not reopen the window after a programmatic close
