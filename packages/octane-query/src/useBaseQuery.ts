// `useBaseQuery` — the shared core of `useQuery` (and friends), reimplemented on
// octane's hooks. Mirrors @tanstack/react-query's useBaseQuery: it creates a
// query Observer, subscribes to it via useSyncExternalStore, and pushes option
// changes through useEffect. The single compiler-injected slot is split into
// distinct sub-slots for each internal base hook, the same way the zustand
// `traditional` binding does.
import { useCallback, useEffect, useState, useSyncExternalStore } from 'octane'
import { environmentManager, noop, notifyManager } from '@tanstack/query-core'
import { resolveClient } from './context'
import { useIsRestoring } from './isRestoring'
import { useQueryErrorResetBoundary } from './errorResetBoundary'
import {
  ensurePreventErrorBoundaryRetry,
  ensureSuspenseTimers,
  fetchOptimistic,
  getHasError,
  shouldSuspend,
  subSlot,
  useSuspensePromise,
  willFetch,
} from './internal'

export function useBaseQuery(
  options: any,
  Observer: any,
  queryClient: any,
  slot: symbol | undefined,
): any {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof options !== 'object' || Array.isArray(options)) {
      throw new Error(
        'Bad argument type. Starting with v5, only the "Object" form is allowed when calling query related functions. Please use the error stack to find the culprit call. More info here: https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5#supports-a-single-signature-one-object',
      )
    }
  }

  const oq = (tag: string) => subSlot(slot, 'oq:' + tag)
  const client = resolveClient(queryClient)
  const isRestoring = useIsRestoring()
  const errorResetBoundary = useQueryErrorResetBoundary()
  const defaultedOptions = client.defaultQueryOptions(options)

  ;(client.getDefaultOptions().queries as any)?._experimental_beforeQuery?.(
    defaultedOptions,
  )

  const query = client.getQueryCache().get(defaultedOptions.queryHash)

  if (process.env.NODE_ENV !== 'production') {
    if (!defaultedOptions.queryFn) {
      console.error(
        `[${defaultedOptions.queryHash}]: No queryFn was passed as an option, and no default queryFn was found. The queryFn parameter is only optional when using a default queryFn. More info here: https://tanstack.com/query/latest/docs/framework/react/guides/default-query-function`,
      )
    }
  }

  // `subscribed: false` makes a passive query (read the cache, never subscribe).
  // While restoring a persisted client, queries also stay passive.
  const subscribed = options.subscribed !== false
  defaultedOptions._optimisticResults = isRestoring
    ? 'isRestoring'
    : subscribed
      ? 'optimistic'
      : undefined

  ensureSuspenseTimers(defaultedOptions)
  ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary, query)
  // Clear the reset boundary on mount (so a fresh mount can throw again).
  useEffect(
    () => {
      errorResetBoundary.clearReset()
    },
    [errorResetBoundary],
    oq('clr'),
  )

  // Probed BEFORE creating the Observer — the constructor can create the entry.
  const isNewCacheEntry = !client
    .getQueryCache()
    .get(defaultedOptions.queryHash)

  const [observer] = useState(
    () => new Observer(client, defaultedOptions),
    oq('obs'),
  )

  const result = observer.getOptimisticResult(defaultedOptions)

  const shouldSubscribe = !isRestoring && subscribed
  useSyncExternalStore(
    useCallback(
      (onStoreChange: () => void) => {
        const unsubscribe = shouldSubscribe
          ? observer.subscribe(notifyManager.batchCalls(onStoreChange))
          : noop
        observer.updateResult()
        return unsubscribe
      },
      [observer, shouldSubscribe],
      oq('cb'),
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult(),
    oq('uses'),
  )

  useEffect(
    () => {
      observer.setOptions(defaultedOptions)
    },
    [defaultedOptions, observer],
    oq('eff'),
  )

  // Suspend on a promise retained for this query-hook call site. Keeping the
  // settled promise in the dynamic use() sequence prevents a later sequential
  // query from taking this query's replay position. fetchOptimistic clears the
  // reset boundary on error; the replay surfaces that error through the
  // error-boundary throw below.
  useSuspensePromise(
    shouldSuspend(defaultedOptions, result),
    defaultedOptions.queryHash,
    () => fetchOptimistic(defaultedOptions, observer, errorResetBoundary),
    oq('sus'),
  )

  // Error boundary: throw so the nearest @try/@catch (or <ErrorBoundary>) handles
  // it, when the query errored and the options opt into throwing.
  if (
    getHasError({
      result,
      errorResetBoundary,
      throwOnError: defaultedOptions.throwOnError,
      query,
      suspense: defaultedOptions.suspense,
    })
  ) {
    throw result.error
  }

  ;(client.getDefaultOptions().queries as any)?._experimental_afterQuery?.(
    defaultedOptions,
    result,
  )

  // experimental_prefetchInRender: kick the fetch during render so
  // `result.promise` settles even if the component unmounts, and finalize the
  // observer's thenable (via updateResult) when the data lands.
  if (
    defaultedOptions.experimental_prefetchInRender &&
    !environmentManager.isServer() &&
    willFetch(result, isRestoring)
  ) {
    const promise = isNewCacheEntry
      ? // Fetch immediately on render so `.promise` resolves even on unmount.
        fetchOptimistic(defaultedOptions, observer, errorResetBoundary)
      : // Subscribe to the cache promise to finalize the current thenable.
        query?.promise

    promise?.catch(noop).finally(() => {
      observer.updateResult()
    })
  }

  return !defaultedOptions.notifyOnChangeProps
    ? observer.trackResult(result)
    : result
}
