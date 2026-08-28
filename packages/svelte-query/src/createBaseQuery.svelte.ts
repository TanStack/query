import { shouldThrowError } from '@tanstack/query-core'
import { useIsRestoring } from './useIsRestoring.js'
import { useQueryClient } from './useQueryClient.js'
import { createRawRef } from './containers.svelte.js'
import { watchChanges } from './utils.svelte.js'
import type { QueryClient, QueryKey, QueryObserver } from '@tanstack/query-core'
import type {
  Accessor,
  CreateBaseQueryOptions,
  CreateBaseQueryResult,
} from './types.js'

/**
 * Base implementation for `createQuery` and `createInfiniteQuery`
 * @param options - A function that returns query options
 * @param Observer - The observer from query-core
 * @param queryClient - Custom query client which overrides provider
 */
export function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: Accessor<
    CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >,
  Observer: typeof QueryObserver,
  queryClient?: Accessor<QueryClient>,
): CreateBaseQueryResult<TData, TError> {
  /** Load query client */
  const client = $derived(useQueryClient(queryClient?.()))
  const isRestoring = useIsRestoring()

  const resolvedOptions = $derived.by(() => {
    const opts = client.defaultQueryOptions(options())
    opts._optimisticResults = isRestoring.current ? 'isRestoring' : 'optimistic'
    return opts
  })

  /** Creates the observer */
  // svelte-ignore state_referenced_locally - intentional, initial value
  let observer = $state(
    new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
      client,
      resolvedOptions,
    ),
  )
  watchChanges(
    () => client,
    'pre',
    () => {
      observer = new Observer<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        TQueryKey
      >(client, resolvedOptions)
    },
  )

  function createResult() {
    const result = observer.getOptimisticResult(resolvedOptions)
    return !resolvedOptions.notifyOnChangeProps
      ? observer.trackResult(result)
      : result
  }
  const [query, update] = createRawRef(
    // svelte-ignore state_referenced_locally - intentional, initial value
    createResult(),
  )

  // A trigger separate from `query` itself: the throw-effect below needs to
  // re-run whenever the result updates, but reading `query.isError`/
  // `query.isFetching` there would mark them as tracked on the `trackResult`
  // proxy (by default) the first time an error occurs — permanently widening
  // `notifyOnChangeProps` for every consumer of this query from then on, even
  // ones that only ever read `data`. Reading the untracked `getCurrentResult()`
  // instead avoids this, matching how `useBaseQuery` reads the pre-`trackResult`
  // result for its own error check.
  //
  // This still notifies reliably once `throwOnError` is set, because
  // `QueryObserver` force-adds `'error'` to the notified props whenever
  // `options.throwOnError` is set (see `queryObserver.ts`), regardless of what
  // any consumer has read.
  let resultVersion = $state(0)

  $effect(() => {
    const unsubscribe = isRestoring.current
      ? () => undefined
      : observer.subscribe(() => {
          update(createResult())
          resultVersion++
        })
    observer.updateResult()
    return unsubscribe
  })

  watchChanges(
    () => resolvedOptions,
    'pre',
    () => {
      observer.setOptions(resolvedOptions)
    },
  )
  watchChanges(
    () => [resolvedOptions, observer],
    'pre',
    () => {
      // The only reason this is necessary is because of `isRestoring`.
      // Because we don't subscribe while restoring, the following can occur:
      // - `isRestoring` is true
      // - `isRestoring` becomes false
      // - `observer.subscribe` and `observer.updateResult` is called in the above effect,
      //   but the subsequent `fetch` has already completed
      // - `result` misses the intermediate restored-but-not-fetched state
      //
      // this could technically be its own effect but that doesn't seem necessary
      update(createResult())
      resultVersion++
    },
  )

  $effect(() => {
    // Depend on `resultVersion`, NOT on `query` itself, so this reaction re-runs
    // whenever the result updates without marking `isError`/`isFetching`/`error`
    // as tracked props on `query` (see `resultVersion` above). Reads the actual
    // values from `observer.getCurrentResult()`, which is untracked.
    void resultVersion
    const currentResult = observer.getCurrentResult()

    // Must throw from inside this reaction (not from the `subscribe` callback
    // above, which runs through notifyManager's batching outside any active
    // Svelte reaction) — otherwise `<svelte:boundary>` never sees the error.
    if (
      currentResult.isError &&
      !currentResult.isFetching &&
      shouldThrowError(resolvedOptions.throwOnError, [
        currentResult.error,
        observer.getCurrentQuery(),
      ])
    ) {
      throw currentResult.error
    }
  })

  return query
}
