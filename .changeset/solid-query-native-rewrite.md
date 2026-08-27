---
'@tanstack/solid-query': major
---

feat: rewrite the adapter onto Solid 2.0's native async model. Query reads
are now a single async computation (suspends into `<Loading>`, holds
previous data through refetches, routes rejections to `<Errored>`,
serializes settled values for streaming hydration) served through an
auto-reconciling store projection — deep reads are fine-grained and item
identity survives across fetches (keyed by the `reconcile` option, default
`'id'`). Mutations ride Solid core's `action` primitive (transactional
settle, optimistic overlays, callbacks inside the transaction). The
observer notification/store layer is deleted —
`QueryObserver`/`MutationObserver` remain as lifecycle/policy engines only.
Hydration is single-channel and content-addressed (the Solid Router
`query()` pattern): the provider serializes every query the request
touches into Solid's hydration registry under `sq:<queryHash>` at
fetch-dispatch time, each client hook primes the query cache from its own
hash entry through query-core `hydrate()`, prefetched-never-rendered
queries transfer, late mounts adopt past hydration end, and the
provider-owned dehydration channel is deleted. Requires solid-js >
2.0.0-rc.3 (hydration-end divergence takeover).

Breaking: `data` is non-optional on query results (reads suspend instead of
returning `undefined`) and is a readonly store view; `mutateAsync` removed
(`mutate` returns a promise); `reconcile` is now the reconciliation key for
the data store (`string | (item => any) | null`, default `'id'` — the v5
function form is gone, core auto-reconciles); `suspense` option removed
(suspension is the model, boundaries are the control point); the `create*`
runtime and `Create*` type aliases are removed, completing the deprecation
from #8950 — `use*` is the only naming; `isInitialLoading` (deprecated
alias of `isLoading`) is removed from query results. `deferStream` is now implemented
(it was declared but unwired on the v6 line): it passes through to Solid's
per-computation `deferStream` memo option.
