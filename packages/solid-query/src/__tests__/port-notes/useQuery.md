# useQuery.test.tsx port notes

Port of the legacy v5 suite (126 tests) to the Solid 2.0 native read-layer
semantics. Result: **120 tests in the file — 117 passing, 3 skipped
(PORT-REVIEW), 6 deleted.**

General rewrites applied throughout:

- `data` reads moved under `<Loading fallback={...}>`; first-load assertions
  changed from `data: undefined` snapshots to fallback visibility.
- `states.push({ ...result })` render-effect arrays replaced with DOM
  assertions and targeted getter checks at specific times
  (`createEffect(compute, effect)` used where an "effect ran N times"
  observation is itself the behavior under test, e.g. structural sharing).
- Metadata (status, fetchStatus, isFetching, failureCount, ...) rendered
  outside `Loading` boundaries / read untracked from the test body.
- Real-timer `waitFor` loops replaced with `vi.advanceTimersByTimeAsync`.

## Deleted tests

| Test | Reason |
| --- | --- |
| `should track properties and only re-render when a tracked property changes` | v5 proxy property-tracking / render-count contract; no per-render result object exists. |
| `should always re-render if we are tracking props but not using any` | Same removed tracking/notification contract. |
| `should maintain referential equality when reconcile option is a string key` | `reconcile` option no longer exists. |
| `The reconcile fn callback should correctly maintain referential equality` | `reconcile` option no longer exists. |
| `should batch re-renders` | Asserted observer notification batching / render counting — the sequence was the assertion. |
| `should render latest data even if react has discarded certain renders` | v5 render/discard model; components render once in Solid 2.0. |

## Renamed / semantically rewritten tests

- `should share equal data structures between query results` — was written
  against `reconcile` + store proxies; rewritten to assert query-core
  structural sharing (unchanged array items keep identity across refetches).
- `should not refetch query when queryClient changes` — renamed to
  `should switch to the new client cache when queryClient changes`. The
  client argument is a reactive accessor in the new adapter, so the
  captured-once contract is gone. **Currently skipped — see PORT-REVIEW #3.**
- `should pick up a query when re-mounting with gcTime 0` — restructured
  from a cross-branch `<Show>` swap to a sequential unmount → remount. The
  swap variant leaks a parked transition in the reactive engine (see
  "engine-state leaks" below); the sequential variant covers the same
  policy (gcTime 0 removes the query on unobserve; remount fetches fresh).
- networkMode `online` tests — two systematic changes:
  1. During a refetch of committed data, the metadata projection holds the
     committed `fetchStatus` until the transition commits (by design —
     refetch-in-flight is surfaced through `isFetching`). DOM assertions of
     `fetchStatus: paused` mid-refetch were rewritten to assert the cache
     state (`queryCache.find(...).state.fetchStatus`) instead.
  2. `window.dispatchEvent(new Event('online'))` only notifies
     `onlineManager` if its internal flag actually transitioned — mocking
     `isOnline` alone is not enough. Tests now dispatch `offline` when going
     offline (after mount, so the manager's window listeners exist) and the
     legacy tests that ended while paused were extended to resume and settle
     (also required for engine-state hygiene, below).
- `online queries should pause retries if you are offline` — the offline
  dispatch was moved to *after* the second attempt starts; under the new
  timer scheduling the attempt would otherwise pause before running,
  changing the failure counts the legacy test asserted.

## PORT-REVIEW skipped tests (suspected adapter bugs)

### 1. `should keep the previous data on disabled query when placeholderData is set and switching query key multiple times`

After switching the query key on a disabled query (the data node parked on
the never-resolving pending read, committed UI held in a transition), the
options render effect that pushes the new key into the `QueryObserver` is
deferred by that held transition. `result.refetch()` therefore fetches the
OLD key: `[key, 10]` ends with `dataUpdateCount 2` while `[key, 12]` never
fetches. Suggested fix: `refetch` should resolve the current defaulted
options at call time instead of relying on the transition-deferred
`observer.setOptions`.

### 2. `online queries should not fetch if paused and we go online when cancelled and no refetchOnReconnect`

`cancelQueries` on a paused first load reverts the query to pending/idle,
but the adapter's data memo recomputes on that cache event and its
pending-idle branch (`computeData` → `q.fetch(opts)`) immediately starts a
NEW fetch, which pauses again while offline. The cache never rests at
`idle`, and the supposedly-cancelled fetch resumes on reconnect even with
`refetchOnReconnect: false`. Notably the revive fires even though no
consumer reads `.data` anywhere in the test — the data memo recomputes
without an actual read, so "reads pull the async" is running for a node
with no readers. (Stack captured: `computeData` at useBaseQuery.ts:331 via
signals `recompute` during the flush after the cancel's `setState` event.)

### 3. `should switch to the new client cache when queryClient changes`

Client switching is only half reactive. `defaultedOptions`/`query()`
re-derive from the new client — a fetch runs and lands in the new client's
cache — but the cache-event subscription driving the hook's version signal
and the `QueryObserver` are both created once against the initial client
and never re-created. The metadata projection never sees the new client's
cache events, so the DOM stays at `status: pending` forever while the new
cache already holds success data. Either the subscription/observer should
be re-created reactively on client change, or client switching should be
explicitly unsupported (previous captured-once behavior).

## Engine-state leaks (test-suite hygiene, likely engine/adapter bug)

Two patterns leave a **parked transition** behind in the global
`@solidjs/signals` engine that outlives the test's unmount (auto-cleanup
does not remove parked transitions). The leak is invisible until a later
test runs a global `invalidateQueries()` inside a click handler — the
leaked transition merges with the new one in `GlobalQueue.initTransition`,
the two end up sharing a `_pendingNodes` array, and the merge loop pushes
into the array it is iterating until `RangeError: Invalid array length`
crashes the run (every subsequent test then renders nothing and fails).

The two leaking patterns, worked around in-test:

1. **A data read left parked on the never-resolving pending promise** —
   e.g. switching an enabled query to a disabled key and ending the test
   there (`should not fetch when switching to a disabled query`), or
   resetting a disabled query (`...resetting a disabled query with
   resetQueries`). Worked around by settling the read (re-enabling the key
   or refetching) before the test ends. The same applies to tests ending
   with a paused-offline fetch: they now resume and settle before ending.
2. **A `<Show>` branch swap where the outgoing branch's gcTime-0 query is
   GC'd while the incoming branch's pending read holds the swap in a
   transition** (`should pick up a query when re-mounting with gcTime 0`).
   No in-test settle fixes this one (the leaked node belongs to the
   disposed branch), so the test was restructured to a sequential
   unmount → remount.

This should be raised upstream: user code can legitimately produce both
patterns, and a leaked parked transition that can crash the engine on a
later `initTransition` merge is an engine-level bug independent of the test
suite.

## Adapter observations (kept running, not skipped)

- `isFetching` ORs a "value pending" probe on the data node into the
  committed `fetchStatus` check. After `resetQueries` on a *disabled* query
  the data read parks pending forever, so `isFetching` reports `true` while
  `fetchStatus` correctly reads `idle` and nothing fetches. The reset test
  asserts via `fetchStatus` and documents the artifact inline.
- `select` errors surface through the data read into `<Errored>` while the
  cache-level `status` stays `'success'` (the query itself succeeded) —
  asserted accordingly in `should throw an error when a selector throws`.
