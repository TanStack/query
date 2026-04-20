---
'@tanstack/vue-query': patch
---

fix(vue-query): allow computed ref and other reactive values as `queryKey` property in `queryOptions`

This fixes a regression introduced in #10452 where `queryOptions` only accepted plain arrays for the `queryKey` property, but not `computed` refs, `Ref` values, or other reactive values. The related fix in #10465 only covered the `enabled` property.

Now the `queryKey` property in `queryOptions` correctly accepts:
- Plain `QueryKey` arrays
- `Ref<QueryKey>`
- `ComputedRef<QueryKey>`
