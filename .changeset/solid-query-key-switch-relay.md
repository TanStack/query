---
'@tanstack/solid-query': patch
---

fix: compute the data once when a query switches to a key that is already
cached. The read layer bumped its per-hook version signal on every cache
event for its hash, including the observer events that `setOptions` emits
from the options render effect, so the data projection (and `select`) ran
a second time in a later flush and Solid's dev diagnostics reported
`EFFECT_RELAY_TEAR`. The version now moves only on state events (`added`,
`removed`, `updated`). `observerResultsUpdated`, which is how a query going
stale by time reaches the adapter, bumps a separate signal that only
`isStale` reads.
