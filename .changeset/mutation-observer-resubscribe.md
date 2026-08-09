---
'@tanstack/query-core': patch
---

fix(query-core): reconnect MutationObserver to the current mutation on resubscribe (StrictMode fix)

Previously, when a MutationObserver unsubscribed (e.g. React StrictMode's unmount cycle) while a mutation was in flight, it was removed from the mutation's observers list and never reattached on resubscribe, leaving `isPending` stuck as `true` indefinitely. `MutationObserver` now implements `onSubscribe()` to reattach to the current mutation — the same pattern `QueryObserver` already relies on.
