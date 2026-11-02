---
'@tanstack/query-core': patch
---

Refresh queries invalidated during their initial fetch after showing the first result. Repeated invalidations share one refresh, and `cancelRefetch: false` continues to reuse the current fetch.
