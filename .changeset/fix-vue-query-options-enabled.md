---
'@tanstack/vue-query': patch
---

fix(vue-query): allow computed ref and other reactive values as `enabled` property in queryOptions

This fixes a regression introduced in #10452 where `queryOptions` only accepted getter functions for the `enabled` property, but not `computed` refs or other reactive values.

Now the `enabled` property in `queryOptions` correctly accepts:
- `boolean` values
- `Ref<boolean>` 
- `ComputedRef<boolean>`
- `() => boolean` getter functions
- `(query) => boolean` query predicate functions
