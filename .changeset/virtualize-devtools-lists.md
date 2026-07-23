---
"@tanstack/query-devtools": patch
---

perf(devtools): virtualize the query and mutation lists

The devtools panel previously rendered one row per cached query and mutation
with no windowing, and each row registered several query/mutation-cache
subscriptions. With very large caches this mounted thousands of DOM nodes and
subscriptions and could freeze or crash the host page. The lists are now
windowed so only the rows near the scroll viewport are mounted, which also
bounds the per-row subscriptions the global cache handler walks on every event.
Rows use a fixed height and truncate long keys with an ellipsis (the full key
remains available via the row's tooltip, aria-label, and the details pane), and
each mutation row now reads its own state directly instead of scanning the whole
mutation cache.
