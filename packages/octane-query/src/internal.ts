// Shared internals for the binding hooks.
import { shouldThrowError } from '@tanstack/query-core'
import { use, useId, useRef } from 'octane'

// Derive a stable, distinct sub-slot from a wrapper's compiler-injected slot, so
// a hook composing multiple base hooks gives each one its own identity. Tags are
// namespaced per hook (e.g. ':oq:obs', ':ms:cb') to avoid cross-hook collisions.
// Memoized: subSlot runs on EVERY hook call every render, and the naive form
// pays a string concat + global symbol-registry lookup each time. The cache is
// keyed by the slot symbol itself; the minted value is byte-identical to the
// uncached Symbol.for result, so identity is preserved across HMR re-evals and
// the per-package copies of this helper. Key universe is bounded: slots are
// per-call-site module constants (never minted per render).
const subSlotCache = new Map<symbol, Map<string, symbol>>()
export function subSlot(
  slot: symbol | undefined,
  tag: string,
): symbol | undefined {
  if (slot === undefined) return undefined
  let byTag = subSlotCache.get(slot)
  if (byTag === undefined) subSlotCache.set(slot, (byTag = new Map()))
  let sym = byTag.get(tag)
  if (sym === undefined)
    byTag.set(tag, (sym = Symbol.for((slot.description ?? '') + ':' + tag)))
  return sym
}

// Split the compiler-injected trailing slot off a hook's runtime args, returning
// the user args (everything before it) and the slot.
export function splitSlot(args: Array<any>): [Array<any>, symbol | undefined] {
  const tail = args[args.length - 1]
  const slot = typeof tail === 'symbol' ? tail : undefined
  return [slot !== undefined ? args.slice(0, -1) : args, slot]
}

// react-query's default suspense throwOnError: only throw if there's no data.
export const defaultThrowOnError = (_error: unknown, query: any): boolean =>
  query.state.data === undefined

// react-query's ensureSuspenseTimers: a suspense query gets a >=1s staleTime/gcTime
// floor so it can't immediately refetch and re-trigger the fallback in a loop.
export function ensureSuspenseTimers(defaultedOptions: any): void {
  if (defaultedOptions.suspense) {
    const MIN = 1000
    const clamp = (value: any) =>
      value === 'static' ? value : Math.max(value ?? MIN, MIN)
    const orig = defaultedOptions.staleTime
    defaultedOptions.staleTime =
      typeof orig === 'function'
        ? (...args: Array<any>) => clamp(orig(...args))
        : clamp(orig)
    if (typeof defaultedOptions.gcTime === 'number') {
      defaultedOptions.gcTime = Math.max(defaultedOptions.gcTime, MIN)
    }
  }
}

// prevent-error-boundary-retry: when a query opts into throwing, don't retry on
// mount so an already-errored cached query re-throws immediately — UNLESS the
// reset boundary has been reset, in which case a retry is expected.
export function ensurePreventErrorBoundaryRetry(
  options: any,
  errorResetBoundary: { isReset: () => boolean },
  query: any,
): void {
  const throwOnError =
    query?.state.error && typeof options.throwOnError === 'function'
      ? shouldThrowError(options.throwOnError, [query.state.error, query])
      : options.throwOnError
  if (
    options.suspense ||
    options.experimental_prefetchInRender ||
    throwOnError
  ) {
    if (!errorResetBoundary.isReset()) {
      options.retryOnMount = false
    }
  }
}

export const shouldSuspend = (defaultedOptions: any, result: any): boolean =>
  defaultedOptions?.suspense && result.isPending

// A pending result that will actually fetch (not blocked by persistence restore).
export const willFetch = (result: any, isRestoring: boolean): boolean =>
  result.isLoading && result.isFetching && !isRestoring

// react-query's suspense fetch: kick the optimistic fetch and — CRUCIALLY — clear
// the reset boundary on error. Without the clearReset, a boundary reset→retry
// that fails AGAIN leaves `isReset()` true at replay, `getHasError` returns
// false, and a suspense component falls through to render with undefined data
// instead of re-throwing to the boundary. The returned promise resolves even on
// error (the replay surfaces the error through the error-boundary throw).
export function fetchOptimistic(
  defaultedOptions: any,
  observer: any,
  errorResetBoundary: { clearReset: () => void },
): Promise<unknown> {
  return observer.fetchOptimistic(defaultedOptions).catch(() => {
    errorResetBoundary.clearReset()
  })
}

type SuspensePromise = PromiseLike<unknown> & {
  status?: 'pending' | 'fulfilled' | 'rejected'
}

interface SuspensePromiseCache {
  key: unknown
  promise: SuspensePromise | undefined
}

// The server runtime accepts an explicit replay site key. Octane's universal
// public type currently exposes only the client-compatible one-argument form.
const useWithSiteKey = use as unknown as (
  usable: PromiseLike<unknown>,
  siteKey?: symbol | string,
) => unknown

/**
 * Suspend through a stable `use()` occurrence for one query-hook call site.
 *
 * `use()` tracks thenables by dynamic call order. A component with two
 * sequential suspense queries initially reaches only the first query; when it
 * resolves, the first query no longer needs to suspend and the second query is
 * reached for the first time. If the first call simply skips `use()`, the
 * second query takes its call-order position and replay reuses the first
 * query's fulfilled promise, exposing the second query's still-pending result.
 *
 * Retain the promise that suspended this query hook and keep reading it after
 * it settles. That reserves the query hook's dynamic call-order position on
 * the client. Streaming SSR replays fresh hook passes, so an unconditional
 * `useId()` gives each query-hook instance a deterministic server replay key,
 * including when a custom hook is called more than once. A new query key or
 * retry replaces a settled promise; re-renders during the same pending fetch
 * reuse the in-flight promise.
 */
export function useSuspensePromise(
  needsSuspense: boolean,
  key: unknown,
  createPromise: () => PromiseLike<unknown>,
  slot: symbol | undefined,
): void {
  const siteKey = useId(subSlot(slot, 'id'))
  const cache = useRef<SuspensePromiseCache>(
    { key: undefined, promise: undefined },
    slot,
  ).current
  if (
    needsSuspense &&
    (cache.promise === undefined ||
      cache.key !== key ||
      cache.promise.status !== 'pending')
  ) {
    cache.key = key
    cache.promise = createPromise()
  }
  if (cache.promise !== undefined) {
    useWithSiteKey(cache.promise, siteKey)
  }
}

// react-query's getHasError: only throw if the query errored, the boundary isn't
// reset, the query isn't refetching, and the options opt into throwing.
export function getHasError({
  result,
  errorResetBoundary,
  throwOnError,
  query,
  suspense,
}: {
  result: any
  errorResetBoundary: { isReset: () => boolean }
  throwOnError: any
  query: any
  suspense: any
}): boolean {
  return (
    result.isError &&
    !errorResetBoundary.isReset() &&
    !result.isFetching &&
    query &&
    ((suspense && result.data === undefined) ||
      shouldThrowError(throwOnError, [result.error, query]))
  )
}
