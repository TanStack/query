---
'@tanstack/vue-query': patch
---

fix(vue-query): keep query-core's `enabled(query)` callback. Zero-argument getters and refs stay reactive; the query callback is passed through to query-core.
