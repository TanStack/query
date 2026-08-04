---
"@tanstack/query-devtools": patch
---

perf(devtools): stop rescanning the cache in the details panes

While a query was selected, the details pane derived seven values through seven
separate subscriptions, and each located the query by scanning the whole cache
and allocating a full-size array. The cache is keyed by query hash, so each of
those lookups is now a direct retrieval - the same correction the query rows
already had. The mutation details pane has no keyed access available, so its
three lookups are instead derived from one shared scan.
