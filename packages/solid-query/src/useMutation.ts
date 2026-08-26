import { noop, shouldThrowError } from '@tanstack/query-core'
import {
  action,
  createMemo,
  createOptimistic,
  createRenderEffect,
  createSignal,
  onCleanup,
  untrack,
} from 'solid-js'
import { useQueryClient } from './QueryClientProvider'
import type {
  DefaultError,
  Mutation,
  MutationFunctionContext,
} from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from './types'
import type { Accessor } from 'solid-js'

const isServer = typeof window === 'undefined'

/**
 * Durable mutation state: written post-`yield` inside the action's
 * transaction, so it commits atomically with everything else the settle
 * carries (invalidation-triggered refetches included).
 */
interface SettledState<TData, TError, TVariables> {
  status: 'idle' | 'success' | 'error'
  data: TData | undefined
  error: TError | null
  variables: TVariables | undefined
  submittedAt: number
}

const IDLE: SettledState<any, any, any> = {
  status: 'idle',
  data: undefined,
  error: null,
  variables: undefined,
  submittedAt: 0,
}

/**
 * Drive the mutation generator without transaction semantics — the server
 * has no interactive paint to keep atomic. Yielded thenable values are
 * awaited and their results passed back in, matching what `action` does
 * minus the transition bookkeeping.
 */
async function drain<TReturn>(
  iterator: AsyncGenerator<unknown, TReturn, unknown>,
): Promise<TReturn> {
  let input: unknown
  for (;;) {
    const result = await iterator.next(input)
    if (result.done) return result.value
    input = result.value != null ? await result.value : undefined
  }
}

/**
 * Mutations ride core `action`: each `mutate()` call is one transaction.
 *
 * - Transient flight state (`isPending`, in-flight `variables`) is a
 *   `createOptimistic` overlay written at the top of the action — visible
 *   immediately, dropped automatically when the transition settles. The
 *   engine's revert-on-settle IS the submission state machine.
 * - `options.onMutate(variables)` runs inside the same window: it is the
 *   place to apply the caller's own optimistic overlays
 *   (`createOptimistic` / `createOptimisticStore` writes). No context
 *   object, no rollback plumbing — reverting is the engine's job.
 * - The fetch itself goes through query-core:
 *   `mutationCache.build().execute()` supplies retry/backoff, offline
 *   pausing, scoped serial execution, and cache-level lifecycle callbacks.
 *   No `MutationObserver` — the adapter reads the Mutation's state
 *   directly where flight metadata (failureCount, isPaused) is needed.
 * - Options-level callbacks are stripped from the built mutation and
 *   re-run *post-`yield`*, inside the transaction: an
 *   `onSuccess → invalidateQueries` chain issues version bumps whose
 *   refetches hold this very transition, so mutation success and fresh
 *   query data land in one atomic paint (and a single-flight payload has
 *   already primed the cache by the time `execute` resolves).
 * - One `mutate`, returning a safe-to-ignore promise: rejection is also
 *   routed into reactive state, and a no-op catch keeps the ignored
 *   branch from surfacing as an unhandled rejection. The
 *   `mutate`/`mutateAsync` split existed for React's callback-vs-promise
 *   error routing; it has no space here.
 */
export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  queryClient?: Accessor<QueryClient>,
): UseMutationResult<TData, TError, TVariables, TOnMutateResult> {
  const client = createMemo(() => useQueryClient(queryClient?.()))

  /** Optimistic overlay: non-null exactly while a mutation is in flight. */
  const [flight, setFlight] = createOptimistic<{
    variables: TVariables
  } | null>(null)

  const [settled, setSettled] = createSignal<
    SettledState<TData, TError, TVariables>
  >(IDLE as SettledState<TData, TError, TVariables>)

  /**
   * Flight metadata (retry failures, offline pause) lives on the Mutation
   * instance and changes during the await gap; a version bump per cache
   * event for the active mutation keeps reads current without cloning
   * observer results.
   */
  let activeMutation: Mutation<TData, TError, TVariables> | null = null
  const [flightVersion, setFlightVersion] = createSignal(0)
  if (!isServer) {
    const unsubscribe = client()
      .getMutationCache()
      .subscribe((event) => {
        if ('mutation' in event && event.mutation === activeMutation) {
          setFlightVersion((v) => v + 1)
        }
      })
    onCleanup(unsubscribe)
  }

  async function* run(
    variables: TVariables,
  ): AsyncGenerator<unknown, TData, unknown> {
    const opts = untrack(options)
    const callbackContext: MutationFunctionContext = {
      client: untrack(client),
      meta: opts.meta,
      mutationKey: opts.mutationKey,
    }
    // Server render is pure (rc.3 deprecates server setter calls): the
    // drain path only needs the return value/throw, so all reactive
    // bookkeeping — flight overlay and durable settle — is client-only.
    if (!isServer) setFlight({ variables })
    opts.onMutate?.(variables, callbackContext)

    const mutation = client()
      .getMutationCache()
      .build(client(), {
        ...opts,
        // Options-level callbacks re-run below, inside the transaction —
        // executing them here (inside the await gap) would let their
        // cache writes and invalidations escape the atomic settle.
        onMutate: undefined,
        onSuccess: undefined,
        onError: undefined,
        onSettled: undefined,
      }) as unknown as Mutation<TData, TError, TVariables>
    activeMutation = mutation

    /**
     * Failure settle, shared by both paths. Callback routing mirrors
     * query-core's `Mutation.execute` (which never sees these callbacks —
     * they are stripped from the built mutation and re-run here, inside
     * the transaction): `onError` and an error-shaped `onSettled` run,
     * their own failures are reported as unhandled rejections but never
     * displace `error`, then the durable error state commits and the
     * mutate promise rejects with `error`.
     */
    // Must be an async generator: async `yield` awaits its value in place,
    // so a rejecting callback promise throws at the yield inside the local
    // try/catch. A sync generator delegated from an async one gets its
    // values unwrapped by the async-from-sync adapter *outside* the inner
    // frame — the rejection would bypass these catches and kill the run.
    // eslint-disable-next-line @typescript-eslint/require-await -- async for yield-await semantics, not await expressions
    async function* settleFailure(
      error: TError,
    ): AsyncGenerator<unknown, never, unknown> {
      try {
        if (opts.onError)
          yield opts.onError(error, variables, undefined, callbackContext)
      } catch (callbackError) {
        void Promise.reject(callbackError)
      }
      try {
        if (opts.onSettled)
          yield opts.onSettled(
            undefined,
            error,
            variables,
            undefined,
            callbackContext,
          )
      } catch (callbackError) {
        void Promise.reject(callbackError)
      }
      if (!isServer)
        setSettled({
          status: 'error',
          data: undefined,
          error,
          variables,
          submittedAt: mutation.state.submittedAt,
        })
      activeMutation = null
      throw error
    }

    let result: TData
    try {
      result = await mutation.execute(variables)
    } catch (error) {
      yield // re-enter the transaction before writing
      yield* settleFailure(error as TError)
      // Unreachable — settleFailure always throws. Explicit for TS's
      // definite-assignment analysis of `result` (yield* delegation is
      // not narrowed as never-returning).
      throw error
    }
    yield // re-enter the transaction before writing
    try {
      if (opts.onSuccess)
        yield opts.onSuccess(
          result,
          variables,
          undefined as TOnMutateResult,
          callbackContext,
        )
      if (opts.onSettled)
        yield opts.onSettled(
          result,
          null,
          variables,
          undefined,
          callbackContext,
        )
    } catch (callbackError) {
      // Mirror core: a success-path callback failure fails the mutation —
      // even though the cache entry committed success, the hook settles
      // to error with the callback error, and awaiting mutate rejects.
      yield* settleFailure(callbackError as TError)
      // Unreachable — settleFailure always throws (see above).
      throw callbackError
    }
    if (!isServer)
      setSettled({
        status: 'success',
        data: result,
        error: null,
        variables,
        submittedAt: mutation.state.submittedAt,
      })
    activeMutation = null
    return result
  }

  const invoke: (variables: TVariables) => Promise<TData> = isServer
    ? (variables) => drain(run(variables))
    : action(run)

  const mutate: UseMutateFunction<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  > = (variables) => {
    const promise = invoke(variables)
    // Errors also land in reactive state; ignoring the promise must not
    // surface an unhandled rejection. Awaiting it still rejects.
    promise.catch(noop)
    return promise
  }

  const status = () => (flight() !== null ? 'pending' : settled().status)
  const isPending = () => flight() !== null

  /**
   * Errors surface to `<Errored>` when `throwOnError` opts in. The throw
   * must happen in the compute half so it routes through notifyStatus and
   * boundary accounting.
   */
  createRenderEffect(
    () => {
      const state = settled()
      if (
        state.status === 'error' &&
        shouldThrowError(untrack(options).throwOnError, [state.error as TError])
      ) {
        throw state.error
      }
    },
    () => {},
  )

  const result = {
    mutate,
    get data() {
      return settled().data
    },
    get error() {
      return flight() !== null ? null : settled().error
    },
    get variables() {
      return flight()?.variables ?? settled().variables
    },
    get status() {
      return status()
    },
    get isPending() {
      return isPending()
    },
    get isIdle() {
      return status() === 'idle'
    },
    get isSuccess() {
      return status() === 'success'
    },
    get isError() {
      return status() === 'error'
    },
    get submittedAt() {
      return flight() !== null
        ? (flightVersion(), activeMutation?.state.submittedAt ?? 0)
        : settled().submittedAt
    },
    get failureCount() {
      flightVersion()
      return activeMutation?.state.failureCount ?? 0
    },
    get failureReason() {
      flightVersion()
      return (activeMutation?.state.failureReason ?? null) as TError | null
    },
    get isPaused() {
      flightVersion()
      return activeMutation?.state.isPaused ?? false
    },
    reset: () => {
      setSettled(IDLE as SettledState<TData, TError, TVariables>)
    },
  }

  return result as unknown as UseMutationResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >
}
