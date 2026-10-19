---
'@tanstack/react-query': patch
'@tanstack/preact-query': patch
---

Recompute `useMutationState` and `useIsMutating` results when their filters, selector, or query client change, without waiting for a mutation cache update.

Preserve structurally equal result references across renders and support selectors that return non-plain values such as `Date` instances.
