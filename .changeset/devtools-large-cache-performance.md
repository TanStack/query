---
'@tanstack/query-devtools': patch
---

Stop the devtools panel freezing the page when the query cache holds thousands of queries.

The panel rendered one row per cached query and per cached mutation with no windowing, and several of its subscriptions walked the whole cache on every cache event, so both the mount cost and the per-event cost grew with the size of the cache. Opening the panel against a large cache could lock up the page, and it stayed locked up while the cache kept changing.

- Both lists are virtualized: rows are a fixed height and only those intersecting the scroll viewport, plus a small overscan, are mounted. A query key too long for its row is truncated with an ellipsis rather than wrapped.
- `MutationRow` reads its state directly instead of resolving it through the cache.
- The details panes resolve their query by key rather than scanning the cache, and the status badges tally all five statuses in a single pass instead of one scan each.
- The mutation cache fan-out is batched, and tearing one panel down no longer unsubscribes another panel that is still mounted.
- The stylesheet is compiled once per theme and shared, rather than recompiled for every row and every expanded node of the JSON explorer.
- The query list keeps its array identity when its contents have not changed, so consumers only rerun when the list really changed.
- The two subscribers that walk the whole cache coalesce, so a stream of cache events costs one pass per window rather than one pass per event. The window is at least one frame and widens to a multiple of the last pass's measured cost, which bounds the share of the main thread the panel can take as the cache grows; whole-cache tallies can therefore lag a large cache by more than a frame, while per-row state stays immediate.
