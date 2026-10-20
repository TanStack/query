---
'@tanstack/query-broadcast-client-experimental': patch
---

fix: don't overwrite a query that has no data, such as one in error, when another tab broadcasts an `added` event for a query that has not settled yet
