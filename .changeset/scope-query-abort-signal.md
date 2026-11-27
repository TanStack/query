---
'@tanstack/query-core': patch
---

Fix unexpected cancellation of replacement requests and hydrated pending queries by tracking abort signal consumption separately for each fetch.
