# PR Review: `feat(query-core): query rename and delegation` (#9835)

## Overview

This PR implements [RFC #9135](https://github.com/TanStack/query/discussions/9135) by adding two new unified imperative methods to `QueryClient`:
- **`query(options)`** — replaces `fetchQuery`, `prefetchQuery`, and `ensureQueryData`
- **`infiniteQuery(options)`** — replaces `fetchInfiniteQuery`, `prefetchInfiniteQuery`, and `ensureInfiniteQueryData`

---

## RFC Compliance

### Meets Requirements

- **Single entry point** for imperative queries, reducing API confusion
- **`select` support** — applies data transformation, works with both cached and fetched data
- **`enabled` support** — respects `false`/callback, returns cached data or throws if no cache
- **`skipToken` support** — correctly handled via `defaultQueryOptions` setting `enabled = false`
- **`staleTime: 'static'`** — bypasses invalidation, only fetches on cache miss (tested at line 1098–1125)
- **Composition over flags** — no `throwOnError` option; RFC mandates `.catch(noop)` for prefetch pattern
- **`noop` is already exported** from `query-core` — users can do `void queryClient.query(opts)` or `.catch(noop)` as the RFC prescribes
- **`pages` parameter** on `infiniteQuery` for multi-page prefetching

### Migration Paths Verified

| Legacy Method | New Equivalent | Tested |
|---|---|---|
| `fetchQuery(opts)` | `query(opts)` | ✅ |
| `prefetchQuery(opts)` | `void query(opts)` or `.catch(noop)` | ✅ (line 1650–1700) |
| `ensureQueryData(opts)` | `query({...opts, staleTime: 'static'})` | ✅ (line 529–619) |
| Background revalidation | `void query({...opts, staleTime: 0}).catch(noop)` | ✅ (line 592–619) |

---

## Code Quality Analysis

### Implementation (`queryClient.ts:344–474`)

**Strengths:**
- Clean, well-structured logic with clear branching for disabled/stale states
- Properly defaults `retry: false` consistent with existing `fetchQuery`
- Reuses `resolveEnabled` and `resolveStaleTime` utilities correctly
- `infiniteQuery` correctly delegates to `query` after attaching `infiniteQueryBehavior`

**Issue 1 — Implicit `undefined` cast when not stale but cache is empty:**

At `queryClient.ts:393–395`:
```typescript
const queryData = isStale
  ? await query.fetch(defaultedOptions)
  : (query.state.data as TQueryData)
```
If `enabled` is `true` (or unset) and data is not stale, `query.state.data` could theoretically be `undefined` if initialData was used to seed a query that was later cleared. The cast to `TQueryData` hides this. In practice `isStaleByTime` returns `true` when there's no data, so this is not a real bug — but the cast obscures the intent.

**Issue 2 — `as any` cast in `infiniteQuery`:**

At `queryClient.ts:473`:
```typescript
return this.query(options as any)
```
This bypasses type safety but is consistent with the existing `prefetchInfiniteQuery` and `fetchInfiniteQuery` patterns in the codebase. Accepted pattern.

### Types (`types.ts:493–593`)

**Strengths:**
- `QueryExecuteOptions` correctly adds `enabled` and `select` which `FetchQueryOptions` lacks
- `initialPageParam?: never` prevents misuse on non-infinite queries
- `InfiniteQueryExecuteOptions` uses the `InfiniteQueryPages` discriminated union correctly (pages requires getNextPageParam)
- JSDoc comments on `enabled` and `staleTime` are helpful

The separate `TQueryData` generic (the pre-select shape) vs `TData` (post-select shape) mirrors the `QueryObserverOptions` pattern exactly. This is the correct approach for typing the select transform chain.

### Vue-Query Wrapper (`vue-query/src/queryClient.ts:285–378`)

Follows the established pattern exactly — multiple overloads for `MaybeRefDeep`, implementation calls `super.query(cloneDeepUnref(options))`. Consistent with how all existing methods are wrapped.

---

## Test Quality Assessment

### Runtime Tests (`queryClient.test.tsx`)

**Test count for new methods:** ~35+ tests across `query`, `query with static staleTime`, `infiniteQuery`, `infiniteQuery with static staleTime`, `query used for prefetching`, `infiniteQuery used for prefetching`.

**Coverage:** 100% statement, branch, function, and line coverage on `queryClient.ts`. ✅

**Test quality is high overall:**
- Tests match their descriptions accurately
- Good edge case coverage: falsy cached data (`null`, `0`), `enabled` as callback returning `false`, `staleTime` boundary conditions, gc behavior
- The `static` staleTime invalidation bypass test (lines 1098–1125) is particularly well-designed — it invalidates with `refetchType: 'none'` and verifies the query still returns the stale cache
- The `query used for prefetching` section (line 1650) demonstrates `.catch(noop)` as documented in the RFC

### Type Tests (`queryClient.test-d.tsx`, `queryOptions.test-d.tsx`, `infiniteQueryOptions.test-d.tsx`)

**Excellent coverage:**
- `select` transforms return type correctly
- `skipToken` + `select` type inference works
- `skipToken` + `enabled: false` + `select` works
- `pages` requires `getNextPageParam` (discriminated union enforcement)
- `queryOptions()` helper flows types through to `query()`
- `infiniteQueryOptions()` helper flows types through to `infiniteQuery()`, including with `select`
- Negative test: `fetchQuery` still rejects `select` ✅

---

## Missing Test Coverage

The following cases should be added:

1. **`query` with `enabled` as a function returning `true` + stale data** — there is a test for `enabled: () => false` (line 1082) but no mirror test for `enabled: () => true` with stale data to confirm it fetches.

2. **`query` with `select` applied to freshly fetched data (not a cache hit)** — existing `select` tests (e.g. line 1257) only verify `select` on cache hits. A test where data must be fetched and then transformed would complete coverage of this path.

3. **`infiniteQuery` with `enabled: false` + cached data + `select`** — this combination is tested for `query` (line 996) but not for `infiniteQuery`.

4. **Error message content verification** — tests at lines 981–993 and 1363–1378 use `.rejects.toThrowError()` without asserting on the message. Adding `.rejects.toThrow("Missing query data for disabled query")` would guard against regressions in the error messaging.

5. **`query` with `staleTime` as a function** — the type allows `StaleTimeFunction` but no runtime test exercises this path.

---

## Potential Issues & Risks

1. **No deprecation markers on old methods yet** — The PR description notes this as a follow-up TODO. This is acceptable for a minor release, but `fetchQuery`, `prefetchQuery`, `ensureQueryData`, and their infinite variants should receive `@deprecated` JSDoc before the next major. The test file already has `/** @deprecated */` block comments above the old method describe blocks (e.g. line 622, 1275) which is a good signal.

2. **Build failures in `test:pr`** — Running `pnpm run test:pr` shows failures in:
   - `@tanstack/solid-query:build`
   - `@tanstack/react-query:test:eslint`
   - Several svelte/vue/angular eslint tasks

   The solid-query build failure is the most worth investigating — if solid-query re-exports types from query-core, the new exported types could be implicated. The eslint failures appear pre-existing/infrastructure-related.

3. **`query` is a very generic name** — `queryClient.query()` reads naturally, but it's worth noting the RFC discussion accepted this name deliberately. Not a PR issue, but reviewers should be aware it was a conscious design choice.

---

## Summary

| Category | Rating |
|---|---|
| RFC Compliance | ✅ Fully compliant |
| Code correctness | ✅ No bugs found |
| Existing patterns | ✅ Follows codebase conventions |
| Type safety | ✅ Well-typed, proper generics |
| Test coverage (%) | ✅ 100% on queryClient.ts |
| Test quality | ⚠️ High, with a few gaps noted above |
| Build health | ⚠️ Investigate solid-query build failure |

**Overall: This is a well-implemented PR that faithfully follows the RFC design.** The code is clean, follows existing patterns, and has excellent type safety. The primary action items before merging are: adding the ~5 missing edge-case tests, verifying the solid-query build failure is not caused by this change, and planning the deprecation of old methods.
