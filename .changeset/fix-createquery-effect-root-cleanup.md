---
'@tanstack/svelte-query': minor
---

Fix observer cleanup in $effect.root for createQuery/createInfiniteQuery (#11587)

- Register cleanup via $effect (runs once, returns cleanup function) for $effect.root disposer
- Preserves onDestroy for component context
- Fixes observer leaks after $effect.root disposal
- Fixes interval refetch continuation after disposal
- Fixes pending request abortion on disposal
- Adds comprehensive tests