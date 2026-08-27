# Port notes: useMutationState.test.tsx

Legacy file: 2 tests. Ported result: 2 kept (rewritten), 0 deleted, plus
1 new skipped test documenting a suspected adapter bug (PORT-REVIEW).

## The adapter bug shaping this port

`useMutationState` feeds a plain `createSignal` from a mutation-cache
subscription. Mutations started through the new `useMutation` ride core
`action`: the cache's `added`/`pending` events are emitted synchronously
inside `mutation.execute()`, i.e. inside the action's transaction window,
so the hook's signal write is **held until the transaction settles** and
only the settle-time value ever commits. Verified experimentally: during a
`useMutation` flight a plain signal written from cache events never shows
the in-flight value in the DOM (it commits the settle-time value at
settle), while a `createOptimistic` signal written from the same events
shows the in-flight value correctly — which is exactly how `useMutation`'s
own `isPending` overlay works. `useMutationState` (and `useIsMutating`)
likely need the same optimistic/out-of-band write.

Consequence: in-flight mutation state (pending count, pending variables)
is unobservable through this hook for `useMutation`-driven mutations. To
keep the hook's own contract (cache-subscription-fed state, filters,
select) under test, both kept tests drive mutations through the mutation
cache directly (`mutationCache.build(client, options).execute(variables)`
via a local `startMutation` helper) — outside any action transaction the
events commit normally and the full in-flight progression is observable.

## Kept (rewritten)

### `should return all mutation states when called without options`

Same shape and assertions as legacy (count 0 → 1 while in flight → 1
after settle), with the button driving `startMutation` instead of
`useMutation().mutate` for the reason above.

### `should return variables after calling mutate` → `should return variables while the mutation is pending`

Same `filters: { status: 'pending' }` + `select` shape and the same
observed sequence `[[], [1], []]` via `createRenderEffect`, driven through
`startMutation`. The legacy `mutation.data` render (and its `data: data1`
assertion) was dropped along with the `useMutation` usage; mutation
result rendering is covered by `useMutation-semantics.test.tsx`.

## Added, skipped (PORT-REVIEW)

### `should observe pending state of mutations started by useMutation`

`it.skip` — captures the legacy tests' `useMutation` integration: a
pending-filtered state count that should read 1 while the mutation is in
flight. Fails today because of the held-write behavior described above.
Re-enable once the adapter gives the mutation-state hooks an
optimistic/out-of-band write path.

## Resolution (post-port)

The PORT-REVIEW test above has been re-enabled and passes. Adapter fixes:
- Counting hooks (`useIsFetching`/`useIsMutating`/`useMutationState`) now use a durable signal + writable optimistic memo pair, so cache events surface immediately inside action transactions and commit normally outside them.
- `useBaseQuery` computeData now returns `NEVER` while `isRestoring()` is true (tracked read), mirroring the hydration-window guard.
