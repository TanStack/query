---
'@tanstack/solid-query': patch
---

fix: commit the idle read of a disabled query on the server. A query
disabled with nothing cached parked its reader on a promise that never
settles, which is the intended client behavior — an enabling change, a
refetch or a cache write revives it. The server has no later: the render
has to finish, and nothing will enable the query or write the cache
before it does, so the render stalled forever and emitted nothing at all.
The server now commits the idle read, which is the settled SSR truth for
a disabled query and the same contract its meta channel already honors.
