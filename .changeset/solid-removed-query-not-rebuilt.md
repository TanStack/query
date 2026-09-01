---
'@tanstack/solid-query': patch
---

fix: stop a mounted observer from re-creating and refetching a removed
query. The read layer bumps its per-hook version signal on every cache
event for its hash, `removed` included, and the recompute that followed
called `queryCache.build()`, which put the entry the caller had just
deleted straight back. The resurrection was not passive: the rebuilt
entry also re-pointed the still-live observer, whose mount-fetch policy
then refetched and repopulated the key, so `removeQueries()` (and
`clear()`) could not be made to stick while any hook observed the key.
`query()` now reuses the entry it last read when the cache no longer
holds that hash, and only builds when the hash is genuinely new, so a
removal leaves the cache empty and fires no fetch, while the mounted
reader holds its last value until options change or a real entry returns
through `setQueryData`, a refetch or a later mount. This is the behavior
of the other adapters, and of solid-query at 6.0.0-rc.0.
