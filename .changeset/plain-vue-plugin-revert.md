---
'@tanstack/vue-query-devtools': patch
---

Build Vue SFCs with `@vitejs/plugin-vue` again so the published `dist` is a production compile and no longer contains dev-only helpers or absolute build paths (`__file`).
