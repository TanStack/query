---
'@tanstack/query-core': patch
---

Reattach `MutationObserver` to its current mutation when a listener subscribes again, so a `useMutation` result no longer stays `pending` after React tears down and re-establishes the subscription mid-mutation.
