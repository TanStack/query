---
'@tanstack/query-core': patch
'@tanstack/vue-query': patch
---

fix(vue-query): export the helper types referenced by `queryOptions`

Re-export from the package roots the supporting types that the public
`queryOptions` signature depends on but that were previously unreachable:
`ShallowOption` and `MaybeRefOrGetter` from `@tanstack/vue-query`, and
`QueryBehavior`, `RetryValue` and `RetryDelayValue` from `@tanstack/query-core`.
This lets downstream libraries name the inferred `queryOptions` return type in
their emitted declarations (#11042).
