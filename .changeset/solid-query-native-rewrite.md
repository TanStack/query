---
'@tanstack/solid-query': major
---

feat: rewrite the adapter onto Solid 2.0's native async model. Query reads
are now a single async memo (suspends into `<Loading>`, holds previous data
through refetches, routes rejections to `<Errored>`, serializes settled
values for streaming hydration); mutations ride Solid core's `action`
primitive (transactional settle, optimistic overlays, callbacks inside the
transaction). The observer notification/store layer is deleted —
`QueryObserver`/`MutationObserver` remain as lifecycle/policy engines only.

Breaking: `data` is non-optional on query results (reads suspend instead of
returning `undefined`); `mutateAsync` removed (`mutate` returns a promise);
`reconcile` option removed (core `structuralSharing` covers referential
stability); `suspense` option removed (suspension is the model, boundaries
are the control point). `deferStream` is now implemented (it was declared
but unwired on the v6 line): it passes through to Solid's per-computation
`deferStream` memo option.
