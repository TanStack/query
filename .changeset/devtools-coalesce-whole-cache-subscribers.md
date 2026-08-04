---
'@tanstack/query-devtools': patch
---

Coalesce the devtools subscribers that walk the whole query cache

Two devtools subscribers - the query count and the status tallies - inspect
every query in the cache each time they run. They ran once per cache event, so
a stream of arriving, updating and expiring queries cost a full-cache pass per
event, and each `setQueryData` emits two events. With several thousand queries
this was enough to stall the page while the panel was open.

These two subscribers now coalesce: a subscriber that has been idle runs
immediately, and further events arriving within roughly one frame are folded
into a single trailing pass. The window is measured in time rather than
microtasks, so it still coalesces when each event arrives in its own task, as
network responses do. Per-row subscribers are already filtered to a single
query and are unchanged.
