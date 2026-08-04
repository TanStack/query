---
"@tanstack/query-devtools": patch
---

perf(devtools): batch the mutation cache fan-out

A mutation-cache event scheduled every subscriber on its own microtask, so each
signal write triggered an independent downstream update. The fan-out now runs
inside a single microtask with the writes batched together, so one event
produces one update. The dispatch stays deferred, unlike the query cache path
which notifies synchronously.
