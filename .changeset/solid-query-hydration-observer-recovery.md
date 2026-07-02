---
'@tanstack/solid-query': patch
---

fix(solid-query): restore observer subscription and store sync after SSR hydration

During hydration, Solid restores `useBaseQuery`'s resource memo from the
value the server serialized, so the compute's wiring never runs on the
client: sync-serialized values (query settled before the shell flushed)
skip the compute entirely, and async-serialized values (query streamed as
a pending promise) replay it under a constructor-less `MockPromise` stub
that drops the Promise executor's side effects. Either way the
`QueryObserver` subscription was never established, leaving hydrated
components permanently inert — `setQueryData`, refetches, and
invalidations never reached the DOM.

Recovery now runs on unowned timers after hydration fully completes
(`sharedConfig.done`, which accounts for asynchronously resumed Loading
boundaries): the observer subscription is re-established with a guarded
store catch-up, and streamed-pending queries additionally seed the cache
from the serialized snapshot and re-run the compute under the native
`Promise`. Owned computations are deliberately avoided — a client-only
render effect created during the walk shifts the hydration keys of every
subsequent computation in the component and breaks DOM claiming
("unclaimed server-rendered node" warnings, duplicated inert DOM).
