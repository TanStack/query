---
'@tanstack/query-core': patch
---

Reduce observer churn overhead by removing observers in place instead of copying the observer list for every unsubscribe.
