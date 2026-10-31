---
'@tanstack/solid-query': patch
---

fix(solid-query): only bump the cache-event version signal when the reader's result actually moves. Observer bookkeeping (attach, detach, re-derive) no longer re-runs every derived read, so a nested observer under a `Show` gated on a parent's data mounts once instead of looping.
