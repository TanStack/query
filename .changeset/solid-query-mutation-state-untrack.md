---
'@tanstack/solid-query': patch
---

fix(solid-query): stop `useMutationState` making the computation that triggers a mutation depend on its result

The mutation-cache subscription read the hook's own result signal. `MutationCache` notifies synchronously, so that read happened while the computation that called `mutate` was still the active listener — registering the signal as one of its dependencies, which `setResult` then immediately invalidated. Calling `mutate` from inside an effect therefore re-ran that effect on every mutation, and an unguarded `mutate` looped. The read is now untracked.
