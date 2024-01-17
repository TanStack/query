import {
  DestroyRef,
  assertInInjectionContext,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core'
import { notifyManager } from '@tanstack/query-core'
import {
  EMPTY,
  Subject,
  catchError,
  fromEvent,
  lastValueFrom,
  shareReplay,
  skip,
  switchMap,
  take,
  takeUntil,
} from 'rxjs'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { signalProxy } from './signal-proxy'
import type {
  QueryClient,
  QueryFunctionContext,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import type { CreateBaseQueryOptions, CreateBaseQueryResult } from './types'
import type { Subscription } from 'rxjs'

/**
 * Base implementation for `injectQuery` and `injectInfiniteQuery`.
 */
export function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
  TPageParam = never,
>(
  options: (
    client: QueryClient,
  ) => CreateBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey,
    TPageParam
  >,
  Observer: typeof QueryObserver,
  queryClient: QueryClient,
): CreateBaseQueryResult<TData, TError> {
  assertInInjectionContext(createBaseQuery)
  const destroyRef = inject(DestroyRef)

  /**
   * Subscription to the query$ observable.
   */
  let subscription: Subscription | undefined

  /**
   * Signal that has the default options from query client applied
   * computed() is used so signals can be inserted into the options
   * making it reactive. Wrapping options in a function ensures embedded expressions
   * are preserved and can keep being applied after signal changes
   */
  const defaultedOptionsSignal = computed(() => {
    const { query$, ...opts } = options(queryClient)

    // If there is a subscription, unsubscribe from it this is to prevent
    // multiple subscriptions on the same computed type
    if (subscription) subscription.unsubscribe()

    /**
     * Subscribe to the query$ observable and set the query data
     * when the observable emits a value. This creates a promise
     * on the queryFn and on each new emit it will update the client
     * side.
     */
    if (query$) {
      const trigger$ = new Subject<
        QueryFunctionContext<TQueryKey, TPageParam>
      >()

      const obs$ = trigger$.pipe(
        switchMap((context) =>
          query$(context).pipe(
            takeUntil(
              // If the signal is aborted, abort the observable
              fromEvent(context.signal, 'abort'),
            ),
          ),
        ),
        shareReplay(1),
        takeUntilDestroyed(destroyRef),
      )

      subscription = obs$
        .pipe(
          skip(1),
          catchError((error: Error) => {
            const query = queryClient
              .getQueryCache()
              .find({ queryKey: opts.queryKey })
            if (query) {
              const { state } = query
              // Mimic the dispatch code on the error case found in the query-core package
              query.setState({
                ...state,
                error,
                errorUpdateCount: state.errorUpdateCount + 1,
                errorUpdatedAt: Date.now(),
                fetchFailureCount: state.fetchFailureCount + 1,
                fetchFailureReason: error,
                fetchStatus: 'idle',
                status: 'error',
              })
            }
            return EMPTY
          }),
        )
        .subscribe({
          next: (value) =>
            queryClient.setQueryData<TQueryFnData>(opts.queryKey, value),
        })

      const queryFn = (
        context: QueryFunctionContext<TQueryKey, TPageParam>,
      ) => {
        // Trigger the observable with the new context.
        const promise = lastValueFrom(obs$.pipe(take(1)))
        trigger$.next(context)
        return promise
      }

      opts.queryFn = queryFn
    }

    const defaultedOptions = queryClient.defaultQueryOptions(opts)

    defaultedOptions._optimisticResults = 'optimistic'
    return defaultedOptions
  })

  const observer = new Observer<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >(queryClient, defaultedOptionsSignal())

  const resultSignal = signal(
    observer.getOptimisticResult(defaultedOptionsSignal()),
  )

  effect(
    () => {
      // Do not notify on updates because of changes in the options because
      // these changes should already be reflected in the optimistic result.
      const defaultedOptions = defaultedOptionsSignal()
      observer.setOptions(defaultedOptions, {
        listeners: false,
      })
      resultSignal.set(observer.getOptimisticResult(defaultedOptions))
    },
    { allowSignalWrites: true },
  )

  // observer.trackResult is not used as this optimization is not needed for Angular
  const unsubscribe = observer.subscribe(
    notifyManager.batchCalls((val) => resultSignal.set(val)),
  )
  destroyRef.onDestroy(unsubscribe)

  return signalProxy(resultSignal) as CreateBaseQueryResult<TData, TError>
}
