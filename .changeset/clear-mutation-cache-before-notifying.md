---
'@tanstack/query-core': patch
---

Clear the mutation cache before notifying subscribers so `useMutationState` and `useIsMutating` update correctly after `queryClient.clear()`.
