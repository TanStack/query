---
'@tanstack/vue-query': patch
---

fix(vue-query): fix queryOptions return type to expose all properties

The `queryOptions` return type now correctly exposes all query option
properties (like `queryFn`, `staleTime`, etc.) for direct access, not
just `queryKey` and `initialData`. This is achieved by excluding the
`Ref` and `ComputedRef` branches from the `MaybeRef` union in the return
type, since `queryOptions` always returns a plain object.
