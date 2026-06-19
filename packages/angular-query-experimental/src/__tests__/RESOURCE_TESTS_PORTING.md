# Resource API test porting — coverage map

This maps every unit spec in the `angular-resource-query` repo to where its coverage
lives in this repo. The resource APIs (`queryResource` / `infiniteQueryResource` /
`mutationResource`) are a thin projection over TanStack's existing observers and cache,
so specs that exercise the **engine** (caching, retries, hashing, persistence, …) are
already covered far more thoroughly by `@tanstack/query-core`'s own suite and are
**not** re-ported. Specs that exercise the **resource surface** are ported.

## Ported as resource tests

| `angular-resource-query` spec | Ported to | Notes |
| --- | --- | --- |
| `query-resource.spec.ts` | `query-resource.test.ts` › *basics* / *reactive key* | dedup with `injectQuery`, reactive key switching |
| `select-placeholder.spec.ts` | `query-resource.test.ts` › *select & placeholderData* | `select` and `placeholderData` flow through core |
| `ref-actions.spec.ts` | `query-resource.test.ts` › *actions* | `set`/`update`/`reload`/`refetch`, refetch-error, `failureCount` |
| `cancellation.spec.ts` | `query-resource.test.ts` › *cancellation & gc* | `queryClient.cancelQueries` aborts the signal |
| `gc.spec.ts` | `query-resource.test.ts` › *cancellation & gc* | `gcTime` disposes the cache entry on unmount |
| `structural-sharing-query.spec.ts` | `query-resource.test.ts` › *structural sharing* | referential stability across refetches |
| `network-mode.spec.ts` | `query-resource.test.ts` › *networkMode* | offline pause / reconnect resume |
| `refetch-interval.spec.ts` | `query-resource.test.ts` › *refetchInterval* | interval polling while mounted |
| `infinite-query.spec.ts` | `infinite-query-resource.test.ts` | first page, `fetchNextPage`, `maxPages` |
| `infinite-bidirectional.spec.ts` | `infinite-query-resource.test.ts` | `fetchPreviousPage`, mixed paging |
| `mutation-resilience.spec.ts` | `mutation-resource.test.ts` | retry, no-retry-by-default, offline pause |

## Behavioral difference to be aware of

`ref-actions.spec.ts` asserts that a **background refetch error preserves
`queryStatus: 'success'`**. TanStack core instead sets `status: 'error'` on any fetch
failure even when cached data is preserved (`query-core/src/query.ts`). The ported test
(`query-resource.test.ts` › *preserves cached data when a refetch errors*) therefore
asserts the TanStack semantics: `data()` stays, the resource stays `resolved` (so
`value()` does not throw and `hasValue()` is `true`), while `queryStatus()` is `'error'`,
`isError()` is `true`, and the error is on `failureReason()`. Because an Angular
`ResourceSnapshot` cannot carry both a value and an error, the resource `error()` signal
only reflects a *hard* failure (no cached data); a background error with cached data is
surfaced via `failureReason()` / `isError()` / `queryStatus()`.

## Covered by existing suites (not re-ported)

| `angular-resource-query` spec | Already covered by |
| --- | --- |
| `store-imperative.spec.ts`, `store-extras.spec.ts`, `query-store.spec.ts` | `QueryClient` API — `query-core/src/__tests__/queryClient.test.tsx` |
| `cache-callbacks.spec.ts` | `QueryCache` callbacks — `query-core/src/__tests__/queryCache.test.tsx` |
| `mutation-cache.spec.ts` | `query-core/src/__tests__/mutationCache.test.tsx` |
| `focus-reconnect.spec.ts` | `focusManager` / `onlineManager` + `QueryObserver` (shared by the resource layer) — core + `inject-query` tests |
| `hydration.spec.ts` | `query-core/src/__tests__/hydration.test.tsx` |
| `persistence.spec.ts` | `@tanstack/query-persist-client-core` + sync/async storage persister packages |
| `broadcast.spec.ts` | `@tanstack/query-broadcast-client-experimental` |
| `query-key.spec.ts` | `hashKey` / `partialMatchKey` — `query-core/src/__tests__/utils.test.tsx` |
| `query-devtools.spec.ts` | `@tanstack/query-devtools` + adapter `with-devtools` tests |
| `composition.spec.ts` (`selectQuery` / `combineQueries`) | `select` option + `computed()`; multi-query is `injectQueries` |
| `internal/retry.spec.ts` | `query-core/src/__tests__/retryer.test.tsx` |
| `internal/structural-sharing.spec.ts` | `replaceEqualDeep` — `query-core/src/__tests__/utils.test.tsx` |

## Running

These tests require **Angular ≥ 22** (the resource APIs use `resourceFromSnapshots`).
From the repo root:

```bash
pnpm install
pnpm --filter @tanstack/angular-query-experimental test:lib
pnpm --filter @tanstack/angular-query-experimental test:types
```
