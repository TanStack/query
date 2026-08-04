---
'@tanstack/angular-query-experimental': minor
---

feat(angular-query): add resource-shaped APIs `queryResource`, `infiniteQueryResource`, and `mutationResource`

These are resource-shaped counterparts to `injectQuery`, `injectInfiniteQuery`, and `injectMutation`. Each returns a real Angular `Resource<T>` (`value`/`status`/`error`/`isLoading`/`hasValue`/`snapshot`) in addition to the TanStack result fields, and is backed by the **same** `QueryClient`, observers and cache as its `inject*` counterpart — so they dedupe and share data with existing queries.

`queryResource` (and the infinite variant) accept both an ergonomic config object (with reactive `queryKey` / `enabled` thunks) and an options-function (whole-object reactive, identical semantics to `injectQuery(() => ({ ... }))`).

NOTE: these APIs are built on Angular 22's stable resource snapshot APIs (`resourceFromSnapshots`, `ResourceSnapshot`), so this change raises the `@angular/core` / `@angular/common` peer dependency minimum to `>=22`. For consumers on Angular < 22 this is a breaking change; the existing `inject*` APIs are otherwise unchanged. Final release strategy (minor vs. major) is left to maintainers.
