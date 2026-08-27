# Port notes: mutationOptions.test.tsx

Legacy file: 14 tests. Ported file: 14 tests — 10 kept unchanged and
passing, 4 skipped (`it.skip` + `PORT-REVIEW`), 0 deleted.

## Kept unchanged (10)

- 2× "should return the object received as a parameter without any
  modification" (identity tests).
- 4× `queryClient.isMutating` variants — these sample the mutation cache
  imperatively from a cache subscription (no reactive signals), so they
  observe the in-flight count correctly and pass unchanged.
- 4× `useMutationState` variants — they assert the post-settle snapshot
  (`status: 'success'` filter), which commits fine.

## Skipped (4) — suspected adapter gap in `useIsMutating`

All four `useIsMutating` variants:

- should return the number of fetching mutations when used with
  useIsMutating (with mutationKey in mutationOptions)
- … (without mutationKey in mutationOptions)
- … (two mutations, no filter)
- … (filter mutationOpts1.mutationKey)

Observed behavior: the reactive count never leaves 0. `useIsMutating`
mirrors `client.isMutating()` into a plain `createSignal` from a
mutation-cache subscription. Mutations now execute inside a Solid action
transaction; the subscription callback fires within that transaction's
(async) context, so the `setMutations(1)` write is held until the
transaction settles — at which point the mutation has already finished
and the staged value is 0 again. The intermediate in-flight count is
never reactively observable regardless of how the mutation is triggered
(verified with both click handlers and timer callbacks).

Suspected fix location: `useIsMutating.ts` — the count likely needs to be
an optimistic overlay (`createOptimistic`, like useMutation's flight
state) rather than a plain signal, so pending counts surface during the
transaction. (Not fixed here per porting rules: no source changes.)

Note: the standalone `useIsMutating.test.tsx` / `useMutationState.test.tsx`
suites (outside this port's scope) fail for related reasons, including
`ACTION_CALLED_IN_OWNED_SCOPE` from calling `mutate()` in component
bodies.
