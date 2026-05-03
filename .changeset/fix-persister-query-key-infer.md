---
'@tanstack/query-core': patch
---

fix(query-core): wrap `persister`'s `TQueryKey` in `NoInfer` so that the `persister` slot no longer contributes to `TQueryKey` inference. Follow-up to #10510, which removed `NoInfer` on all three `persister` generics. Preserving `NoInfer<TQueryKey>` keeps that fix's benefit for `TQueryFnData` while preventing `TQueryKey` from widening to the augmented constraint when `Register.queryKey` is narrowed — which made `DataTag`-branded wrapper returns un-assignable in contravariant slots.
