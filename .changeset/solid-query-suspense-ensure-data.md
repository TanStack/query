---
'@tanstack/solid-query': patch
---

fix(solid-query): avoid triggering Suspense when data is already cached (e.g. via `ensureQueryData`)
