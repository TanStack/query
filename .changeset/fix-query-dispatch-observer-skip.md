---
'@tanstack/query-core': patch
---

Fix an observer being skipped during query notification when another observer on the same query unsubscribes mid-dispatch. `Query.#dispatch` iterated the live `observers` array while `onQueryUpdate()` could splice it, so a still-subscribed sibling could be left with a stale `pending` result after the query resolved. The notification now iterates over a snapshot of the observers.
