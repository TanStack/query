---
"@tanstack/vue-query": patch
---

fix(vue-query): preserve branded types in MaybeRefDeep

Branded types (e.g. `string & { __brand: 'PostId' }`) were being recursively mapped by `MaybeRefDeep`, causing TypeScript inference failures when used in `queryKey` tuples passed from `queryOptions` to `useQuery`. This fix adds a terminal branch to `MaybeRefDeep` so that branded types are preserved as-is instead of having their properties unwrapped.
