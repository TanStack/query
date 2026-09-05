---
'@tanstack/query-broadcast-client-experimental': patch
---

fix: don't overwrite an existing query's resolved data when another tab broadcasts an `added` event for it
