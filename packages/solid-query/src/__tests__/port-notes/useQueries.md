# Port notes: useQueries.test.tsx

Legacy file: 4 tests. Ported result: 2 kept (rewritten), 1 skipped
(PORT-REVIEW), 1 deleted.

## Kept (rewritten)

### `should return the correct states` → `should render each result as it settles`

The legacy test snapshotted result-state arrays from a tracked effect
(`deep(result)` + spread) and asserted the v5 notification sequence
`[undefined, undefined] → [1, undefined] → [1, 2]`. Spreading a result
reads `.data`, which now suspends while the first fetch is in flight, and
the sequence itself is v5 observer mechanics. Rewritten as DOM assertions
of the same observable behavior:

- each result's `.data` read is wrapped in its own `<Loading>` boundary, so
  the staggered settle (10ms vs 100ms) is visible as `loading1`/`loading2`
  → `data1` + `loading2` → `data1` + `data2`;
- metadata (`status`) is rendered outside any boundary, pinning the
  "metadata reads never suspend" contract through the same progression
  (`pending, pending` → `success, pending` → `success, success`).

### `should use provided custom queryClient`

Kept as-is, plus a `<Loading fallback>` wrapper (the component body reads
`.data`, which suspends into the nearest boundary while the first fetch is
in flight) and an initial `loading` assertion.

## Skipped (PORT-REVIEW — suspected adapter bug)

### `should not fetch for the duration of the restoring period when isRestoring is true`

`it.skip` with the body rewritten to metadata-only assertions (the legacy
`data: undefined` reads were dropped — `.data` is a suspending read now).
It still fails: **the pending-idle branch of `useBaseQuery`'s
`computeData` starts a fetch through `q.fetch(opts)` without consulting
`isRestoring`, and the data memo (`adopted`) evaluates eagerly at
creation** — so mounting under `IsRestoringContext value={() => true}`
immediately flips `fetchStatus` to `'fetching'` and runs the queryFn
(verified with a stack trace: `Query.fetch ← computeData ←
setupComputedNode` during hook setup). The observer-attach path is
correctly gated on `isRestoring`, but the pull-model read path is not —
it only guards `sharedConfig.hydrating`. Note the equivalent `useQuery`
test (`should not fetch while restoring and refetch after restoring is
complete` in `useQuery.test.tsx`) fails today for the same reason (its
whole mount is additionally deferred by an unbounded `.data` read).

Suggested fix direction (not applied — source untouched): the pending-idle
fetch branch should return `NEVER` while `isRestoring()` is true, exactly
like the hydration-window guard, with the post-restoring observer attach
issuing the fetch.

## Deleted

### `should not change state if unmounted`

Mocked `QueriesObserver.subscribe` to keep listeners alive past unmount
and asserted nothing (it existed to catch React's "state update on an
unmounted component" warning). The rewritten `useQueries` does not use
`QueriesObserver` at all (per-position `useBaseQuery` rows over
`QueryObserver` via `repeat`), so the mock is inert and the test pinned
v5 internals with no portable behavior.

## Resolution (post-port)

The PORT-REVIEW test above has been re-enabled and passes. Adapter fixes:
- Counting hooks (`useIsFetching`/`useIsMutating`/`useMutationState`) now use a durable signal + writable optimistic memo pair, so cache events surface immediately inside action transactions and commit normally outside them.
- `useBaseQuery` computeData now returns `NEVER` while `isRestoring()` is true (tracked read), mirroring the hydration-window guard.
