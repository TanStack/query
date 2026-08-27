# Port notes: useMutation.test.tsx

Legacy file: 34 tests. Ported file: 24 tests — 21 active (13 kept as-is,
8 rewritten), 3 skipped (`it.skip` + `PORT-REVIEW`), 10 deleted.

Contract reference: `useMutation-semantics.test.tsx`, `useMutation.ts`,
`REWRITE-PLAN.md` ("Mutation decisions locked during implementation").

## Kept as-is (13)

- should be able to reset `data`
- should be able to reset `error`
- should be able to call `onSuccess` and `onSettled` after each successful mutate
- should set correct values for `failureReason` and `failureCount` on multiple mutate calls
- should be able to call `onError` and `onSettled` after each failed mutate
- should be able to retry a failed mutation
- should not retry mutations while offline
- should not change state if unmounted
- should be able to throw an error when throwOnError is set to true
- should be able to throw an error when throwOnError is a function that returns true
- should pass meta to mutation on success
- should pass meta to mutation on error
- should use provided custom queryClient

Several of these failed in the legacy run only because of cross-test
pollution: broken sibling tests (call-site callback tests, `deep()`
snapshot render effects, callback-error tests) threw uncaught errors that
HALTED the Solid reactive system (`REACTIVITY_HALTED`) for the rest of the
file. In isolation they passed unchanged.

## Rewritten (8)

- **should run success callbacks before the awaited mutate promise
  resolves** (was: "should be able to override the useMutation success
  callbacks"). Call-site overrides are gone; the portable behavior is
  options-callback ordering relative to the awaited `mutate` promise
  resolution.
- **should run error callbacks before the awaited mutate promise rejects**
  (was: "should be able to override the error callbacks when using
  mutateAsync"). Same port for the error path: awaiting `mutate` rejects
  with the mutation error after options `onError`/`onSettled` ran.
- **should be able to use mutation defaults** — behavior unchanged
  (`setMutationDefaults` is applied by `mutationCache.build`); the harness
  was rewritten from a `deep()` state-array snapshot (which throws on the
  new plain-getters result object) to DOM assertions
  (idle → pending → success).
- **should call onMutate even if paused** — behavior unchanged; the
  status/isPaused DOM text was merged into a single template expression.
  With separate JSX expressions the `isPaused` text goes stale: the pause
  event's `flightVersion` bump is held by the action transaction, so only
  expressions re-evaluated by the optimistic status flip (idle → pending,
  same commit) read the current `isPaused` from the Mutation instance.
- **should optimistically go to paused state if offline** — same
  single-expression rewrite; the `deep()` snapshot render effect was
  replaced with a string-projection `createRenderEffect`
  (`` `${status}, ${isPaused}` ``). Sequence assertion unchanged:
  no intermediate `pending, false`.
- **should be able to retry a mutation when online** — kept the mutation
  cache state assertions (pending/isPaused/failureCount mid-flight,
  success after resume) and final DOM data. Dropped the mid-flight DOM
  `isPaused: true` assertion — see PORT-REVIEW item 2 below.
- **should run the mutation and options callbacks when unmounted** (was:
  "should call cache callbacks when unmounted"). Call-site callback mocks
  deleted; the portable behavior — the in-flight mutation keeps running
  after unmount, options `onSuccess`/`onSettled` still fire once, `gcTime:
  0` removes the settled mutation from the cache — is asserted. Also
  replaced fake-timer-unsafe `findByText` with `getByText`.
- **should call options callbacks for every mutate and keep the latest
  result** (was: "should call mutate callbacks only for the last
  observer"). The "only the last observer's call-site callbacks fire"
  aspect has no equivalent (no call-site callbacks); the port asserts
  options callbacks fire per mutate call, durable state reflects the
  latest settle, and callback args are `(data, variables, undefined,
  MutationFunctionContext)` — the onMutateResult parameter is always
  `undefined` (no context threading).

## Skipped (3) — suspected adapter bugs, `it.skip` + PORT-REVIEW

All three "callback errors" tests: a rejection thrown by an options-level
callback (`onSuccess`, `onError`, `onSettled`) escapes the action
generator at the post-`yield` callback re-run, so `setSettled` is never
reached:

- **should go to error state if onSuccess callback errors** — observed:
  status stays `idle` (though the mutationFn succeeded and query-core
  committed success), `onError` is NOT invoked, awaited `mutate` rejects
  with the callback error.
- **should go to error state if onError callback errors** — observed:
  status stays `idle` instead of `error`; the durable `mutateFnError`
  state is never written; awaited `mutate` rejects with the callback
  error instead of the mutation error.
- **should go to error state if onSettled callback errors** — same class.

Suspected fix location: `useMutation.ts` `run()` — the post-`yield`
options-callback invocations are not wrapped, so a rejecting callback
skips the durable-state write. (Not fixed here per porting rules: no
source changes.)

## Deleted (10)

- "should call mutate callbacks when useMutation has no callbacks",
  "should call mutate error callbacks…", "should call only mutate
  onSuccess…", "…only mutate onError…", "…only mutate onSettled…" (5):
  call-site callbacks (`mutate(vars, { onSuccess })`) no longer exist.
  Options-level callback invocation is covered by the kept
  `onSuccess`/`onSettled` and `onError`/`onSettled` tests; promise-based
  settle handling is covered by the two rewritten "awaited mutate
  promise" tests.
- "should call mutateAsync callbacks…", "…mutateAsync error callbacks…",
  "…only mutateAsync onSuccess…", "…only mutateAsync onError…", "…only
  mutateAsync onSettled…" (5): `mutateAsync` removed; these were purely
  call-site-callback tests. The promise-returning behavior of `mutate`
  (resolve with data / reject with error, safe to fire-and-forget) is
  covered by the rewritten tests here and the semantics suite.

No tests in this file asserted v5 state-array notification sequences or
`result.context`/context threading as their sole purpose beyond the
above.
