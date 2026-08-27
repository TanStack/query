---
'@tanstack/react-query': patch
---

fix(react-query): hydrate queries that already exist in the cache during render on the server. `HydrationBoundary` defers those to an effect so an aborted transition cannot overwrite the current page, but effects never run during SSR, so the queue was dropped and children fetched the data a second time (#10145)
