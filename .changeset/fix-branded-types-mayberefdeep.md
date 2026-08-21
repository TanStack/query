---
'@tanstack/vue-query': patch
---

fix(vue-query): preserve branded types in `MaybeRefDeep` so branded `queryKey`s (e.g. `string & { __brand }`) pass through `queryOptions` into `useQuery` without a TS2769 overload error
