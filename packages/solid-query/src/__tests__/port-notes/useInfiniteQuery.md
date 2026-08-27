# Port notes: `useInfiniteQuery.test.tsx`

Legacy v5 suite (27 tests) ported to the SolidJS 2.0 read-layer semantics.
Result: **26 kept (rewritten or unchanged), 0 deleted, 1 skipped
(PORT-REVIEW)**.

## Porting approach

Every state-array notification-sequence test was converted to DOM and getter
assertions:

- First-load phases assert the `<Loading>` fallback plus untracked metadata
  getter reads (metadata never suspends); settled phases assert rendered DOM
  and guard-free `state.data`.
- `createRenderEffect` state collectors were removed entirely — spreading or
  snapshotting the result object in an effect callback reads pending `.data`
  untracked, which throws `PENDING_ASYNC_UNTRACKED_READ` and halts the
  reactive system (this poisoned the whole legacy file).
- `notifyOnChangeProps: 'all'` options were dropped (v5 observer notification
  tuning; meaningless under fine-grained reads).

## Kept tests (26)

| Test | Notes |
| --- | --- |
| should return the correct states for a successful query | Sequence arrays → per-phase getter/DOM assertions (pre-settle metadata, post-settle full surface). |
| should not throw when fetchNextPage returns an error | Kept as-is (already passing). |
| should be able to select a part of the data | DOM assertion on selected pages. |
| should be able to select a new result and not cause infinite renders | Re-pointed: unstable select identity must keep `select` call count bounded (≤3 after 100ms idle). |
| should be able to reverse the data | DOM assertions. |
| should be able to fetch a previous page | DOM + direction-flag text (`isFetchingPreviousPage` scoped, committed page holds). |
| should be able to refetch when providing page params automatically | DOM + flags for next/prev/refetch phases; refetch replays all page params. |
| should return the correct states when refetch fails | DOM: data stays, `status: error`, `isRefetchError` true, page-error flags false. |
| should return the correct states when fetchNextPage fails | DOM: `isFetchNextPageError` true, `isRefetchError` false, data stays. |
| should return the correct states when fetchPreviousPage fails | DOM: `isFetchPreviousPageError` true, data stays. |
| should silently cancel any ongoing fetch when fetching more | Mid-flight direction handoff asserted via untracked getters — the in-progress hold freezes the committed DOM until settle (atomic commits), so the DOM cannot show the cancel-and-redirect; cache state can. |
| should silently cancel an ongoing fetchNextPage request when another fetchNextPage is invoked | Kept as-is (abort-signal assertions; already passing). |
| should not cancel an ongoing fetchNextPage request … `cancelRefetch: false` | Kept as-is (already passing). |
| should keep fetching first page when not loaded yet and triggering fetch more | Fallback stays through the restarted first-page fetch; final data is one page. |
| should stop fetching additional pages when the component is unmounted… | Kept as-is (already passing). |
| should be able to set new pages with the query client | DOM: `setQueryData` swap is reactive without a fetch; refetch replays stored page params. |
| should only refetch the first page when initialData is provided | initialData renders immediately during mount refetch; queryFn call counts pin "only first page refetched". |
| should set hasNextPage to false if getNextPageParam returns undefined | DOM. |
| should compute hasNextPage correctly using initialData | DOM; also pins initialData rendering while mount refetch is in flight. |
| should compute hasNextPage correctly for falsy getFetchMore return value using initialData | DOM. |
| should not use selected data when computing hasNextPage | Kept nearly as-is; explicit fallback added. |
| should build fresh cursors on refetch | `Switch`/`Match` status branching replaced by the `<Loading>` boundary; "Background Updating…" now driven by `isRefetching` (the legacy port's condition was inverted); `state.data` read guard-free. |
| should compute hasNextPage correctly for falsy getFetchMore return value on refetching | Same restructure. Additionally: the `Remove Last Page` signal write must be flushed before clicking `Refetch` — with both clicks in one batch the write joins the refetch's transition hold, and the queryFn (which reads the signal) sees the stale committed value for the entire refetch. This is correct 2.0 transaction semantics, not a bug, but a real porting gotcha. |
| should cancel the query function when there are no more subscriptions | Kept as-is (Blink unmount → abort). |
| should use provided custom queryClient | Guard-free `state.data.pages[0]` read. |
| should work with infiniteQueryOptions | Guard-free read. |

## Deleted tests (0)

None — every legacy test's behavior still exists and was rewritten.

## Skipped tests / PORT-REVIEW items (1)

### `should keep the previous data when placeholderData is set` — `it.skip`

**Suspected adapter bug** in `useBaseQuery.ts` (pending-idle branch of
`computeData`) as exercised through `useInfiniteQuery`.

- Repro: change an infinite query's key reactively (here `[key, order()]`
  with `order` flipping `desc → asc`).
- Mechanism: on the key change the data memo recomputes in the flush's
  **pure phase**, before the `observer.setOptions` render effect (effect
  half) dispatches the new fetch. The compute sees the new query as
  pending-idle and self-fetches via `q.fetch(defaultedOptions)`. But the
  adapter's `defaultedOptions` never carry `behavior: infiniteQueryBehavior()`
  — query-core attaches that inside `InfiniteQueryObserver.setOptions`, which
  hasn't run yet. The fetch therefore executes as a **plain** query: the
  queryFn receives no `pageParam` and the cache entry is committed with the
  raw queryFn return value (e.g. the string `"undefined-asc"`) instead of
  `InfiniteData`.
- Blast radius: any downstream `.pages` read throws
  `TypeError: Cannot read properties of undefined (reading 'join')`, which
  halts the reactive system (`REACTIVITY_HALTED`) and previously poisoned
  every later test in the file (and produced a multi-GB error-serialization
  OOM in vitest).
- Same root cause as the skipped infinite test in `suspense.test.tsx`
  (see `port-notes/suspense.md`).
- Suggested fix direction: the infinite layer's pending-idle self-fetch must
  attach the infinite behavior — e.g. `useInfiniteQuery` supplies options
  with `behavior: infiniteQueryBehavior()` to the base layer, or the compute
  fetches through the lifecycle `InfiniteQueryObserver` instead of raw
  `q.fetch`.
- The test body is fully ported (asserts the native SWR hold across the key
  change; `keepPreviousData` retained as a harmless option) and should pass
  once the adapter is fixed.

## Other findings (no action needed)

- `keepPreviousData` as `placeholderData` is a no-op in the new adapter: the
  function-form placeholder is invoked with no arguments (returns
  `undefined`), and the previous-data hold is native engine behavior instead.
  `isPlaceholderData` stays `false` for it; assertions on it were dropped.
- During an active hold, metadata version bumps are held with the transition
  and commit atomically at settle. Tests that want to observe a mid-hold
  direction change must read the result getters untracked (they see current
  cache state) rather than assert on committed DOM.
