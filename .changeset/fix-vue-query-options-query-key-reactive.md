---
'@tanstack/vue-query': patch
---

fix(vue-query): allow reactive and getter values as `queryKey` property in `queryOptions`

This fixes a regression introduced in #10452 where `queryOptions` only accepted plain arrays for the `queryKey` property, but not `computed` refs, `Ref` values, or getter functions. The related fix in #10465 only covered the `enabled` property.

Now the `queryKey` property in `queryOptions` accepts the same reactive forms as `enabled`:
- Plain `QueryKey` arrays
- `Ref<QueryKey>`
- `ComputedRef<QueryKey>`
- `() => QueryKey` (getter)
