# Port notes: useIsMutating.test.tsx

Legacy file: 5 tests. Ported result: 4 kept (rewritten), 1 deleted, plus
1 new skipped test documenting a suspected adapter bug (PORT-REVIEW).

## The adapter bug shaping this port

Same as `useMutationState` (see `port-notes/useMutationState.md` for the
experiment): `useIsMutating` writes a plain signal from a mutation-cache
subscription, but mutations started through the new `useMutation` emit
their `added`/`pending` cache events inside the action's transaction
window, so the write is held until settle — at which point `isMutating()`
is 0 again. The in-flight count is never observable in the DOM for
`useMutation`-driven mutations. All kept tests therefore drive mutations
through the mutation cache directly
(`mutationCache.build(client, options).execute(variables)` via a local
`startMutation` helper), which emits events outside any transaction and
makes the count fully observable. This tests the hook's actual contract —
a signal fed by mutation-cache subscriptions.

Two further adjustments applied everywhere:

- Legacy tests called `mutate()` synchronously in component bodies
  (via `untrack`); actions cannot be invoked synchronously in owned
  scopes, so all flights are started from timers (`setActTimeout`).
- Legacy `createRenderEffect` count-sequence assertions
  (`[0, 1, 2, 1, 0]` etc.) were converted to DOM assertions at fake-timer
  checkpoints per the porting rules; the filter tests keep a render-effect
  array only for the "never counts the filtered-out mutation"
  (`not.arrayContaining([2])`) invariant.

## Kept (rewritten)

### `should return the number of fetching mutations`

Two overlapping flights (150ms started at t=0, 50ms started at t=50);
DOM-asserted count progression 0 → 1 → 2 → 1 → 0 at t=0/50/100/150.

### `should filter correctly by mutationKey`

Both mutations started at t=10; filtered count reads 1 while both are in
flight, 0 after settle, and never 2.

### `should filter correctly by predicate`

Same as the mutationKey test with a predicate filter.

### `should use provided custom queryClient`

Same shape as legacy: hook and mutation both on a custom client outside
the provider tree; count 0 → 1 → 0.

## Added, skipped (PORT-REVIEW)

### `should count mutations started by useMutation while in flight`

`it.skip` — the `useMutation` integration form of the count test (mutation
fired from a timer, count asserted at 1 during the flight). Fails today
because the hook's signal write is held by the action transaction as
described above. Re-enable once the adapter gives `useIsMutating` an
optimistic/out-of-band write path (like `useMutation`'s own
`createOptimistic` flight overlay).

## Deleted

### `should not change state if unmounted`

Mocked the `MutationCache` module export to keep listeners alive past
unmount and asserted nothing (it existed to catch React's "state update on
an unmounted component" warning). It pins v5 internals — the module-level
constructor spy has no bearing on the rewritten adapter, and Solid has no
equivalent warning to guard against — so there is no portable behavior to
keep.

## Resolution (post-port)

The PORT-REVIEW test above has been re-enabled and passes. Adapter fixes:
- Counting hooks (`useIsFetching`/`useIsMutating`/`useMutationState`) now use a durable signal + writable optimistic memo pair, so cache events surface immediately inside action transactions and commit normally outside them.
- `useBaseQuery` computeData now returns `NEVER` while `isRestoring()` is true (tracked read), mirroring the hydration-window guard.
