---
'@tanstack/react-query': patch
'@tanstack/preact-query': patch
---

Add `NoInfer` to the return types of `useInfiniteQuery`, `useSuspenseQuery`, and `useSuspenseInfiniteQuery` so that an explicitly annotated result type can no longer reverse-infer `TData`, matching `useQuery`. A distributive wrapper is used so discriminated-union narrowing on `data` keeps working.
