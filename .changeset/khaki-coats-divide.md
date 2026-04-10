---
'@tanstack/vue-query-devtools': patch
---

Fix Vue SSR devtools cleanup by only registering `unmount()` after `mount()` has run.
