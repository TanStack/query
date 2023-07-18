/* eslint-disable @typescript-eslint/no-unnecessary-condition */
// Had to disable the lint rule because isServer type is defined as false
// in solid-js/web package. I'll create a GitHub issue with them to see
// why that happens.
import { hydrate, notifyManager } from '@tanstack/query-core'
import { isServer } from 'solid-js/web'
import {
  createComputed,
  createMemo,
  createResource,
  on,
  onCleanup,
} from 'solid-js'
import { createStore, reconcile, unwrap } from 'solid-js/store'
import { useQueryClient } from './QueryClientProvider'
import { shouldThrowError } from './utils'
import type { CreateBaseQueryOptions } from './types'
import type { Accessor } from 'solid-js'
import type { QueryClient } from './QueryClient'
import type {
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'

function reconcileFn<TData, TError>(
  store: QueryObserverResult<TData, TError>,
  result: QueryObserverResult<TData, TError>,
  reconcileOption:
    | string
    | false
    | ((oldData: TData | undefined, newData: TData) => TData),
): QueryObserverResult<TData, TError> {
  if (reconcileOption === false) return result
  if (typeof reconcileOption === 'function') {
    const newData = reconcileOption(store.data, result.data as TData)
    return { ...result, data: newData } as typeof result
  }
  const newData = reconcile(result.data, { key: reconcileOption })(store.data)
  return { ...result, data: newData } as typeof result
}

// Base Query Function that is used to create the query.
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
) {
  const client = createMemo(() => useQueryClient(queryClient?.()))

  const defaultedOptions = client().defaultQueryOptions(options())
  defaultedOptions._optimisticResults = 'optimistic'
  defaultedOptions.structuralSharing = false
  if (isServer) {
    defaultedOptions.retry = false
    defaultedOptions.throwOnError = true
  }
  const observer = new Observer(client(), defaultedOptions)

  const [state, setState] = createStore<QueryObserverResult<TData, TError>>(
    observer.getOptimisticResult(defaultedOptions),
  )

  const createServerSubscriber = (
    resolve: (
      data:
        | QueryObserverResult<TData, TError>
        | PromiseLike<QueryObserverResult<TData, TError> | undefined>
        | undefined,
    ) => void,
    reject: (reason?: any) => void,
  ) => {
    return observer.subscribe((result) => {
      notifyManager.batchCalls(() => {
        const query = observer.getCurrentQuery()
        const { refetch, ...rest } = unwrap(result)
        const unwrappedResult = {
          ...rest,

          // hydrate() expects a QueryState object, which is similar but not
          // quite the same as a QueryObserverResult object. Thus, for now, we're
          // copying over the missing properties from state in order to support hydration
          dataUpdateCount: query.state.dataUpdateCount,
          fetchFailureCount: query.state.fetchFailureCount,
          // Removing these properties since they might not be serializable
          // fetchFailureReason: query.state.fetchFailureReason,
          // fetchMeta: query.state.fetchMeta,
          isInvalidated: query.state.isInvalidated,
        }

        if (unwrappedResult.isError) {
          if (process.env['NODE_ENV'] === 'development') {
            console.error(unwrappedResult.error)
          }
          reject(unwrappedResult.error)
        }
        if (unwrappedResult.isSuccess) {
          // Use of any here is fine
          // We cannot include refetch since it is not serializable
          resolve(unwrappedResult as any)
        }
      })()
    })
  }

  const createClientSubscriber = () => {
    return observer.subscribe((result) => {
      notifyManager.batchCalls(() => {
        // @ts-expect-error - This will error because the reconcile option does not
        // exist on the query-core QueryObserverResult type
        const reconcileOptions = observer.options.reconcile
        // If the query has data we dont suspend but instead mutate the resource
        // This could happen when placeholderData/initialData is defined
        if (queryResource()?.data && result.data && !queryResource.loading) {
          setState((store) => {
            return reconcileFn(
              store,
              result,
              reconcileOptions === undefined ? 'id' : reconcileOptions,
            )
          })
          mutate(state)
        } else {
          setState((store) => {
            return reconcileFn(
              store,
              result,
              reconcileOptions === undefined ? 'id' : reconcileOptions,
            )
          })
          refetch()
        }
      })()
    })
  }

  /**
   * Unsubscribe is set lazily, so that we can subscribe after hydration when needed.
   */
  let unsubscribe: (() => void) | null = null

  const [queryResource, { refetch, mutate }] = createResource<
    QueryObserverResult<TData, TError> | undefined
  >(
    () => {
      return new Promise((resolve, reject) => {
        if (isServer) {
          unsubscribe = createServerSubscriber(resolve, reject)
        } else {
          if (!unsubscribe) {
            unsubscribe = createClientSubscriber()
          }
        }
        if (!state.isLoading) {
          resolve(state)
        }
      })
    },
    {
      initialValue: state,

      // If initialData is provided, we resolve the resource immediately
      ssrLoadFrom: options().initialData ? 'initial' : 'server',

      get deferStream() {
        return options().deferStream
      },

      /**
       * If this resource was populated on the server (either sync render, or streamed in over time), onHydrated
       * will be called. This is the point at which we can hydrate the query cache state, and setup the query subscriber.
       *
       * Leveraging onHydrated allows us to plug into the async and streaming support that solidjs resources already support.
       *
       * Note that this is only invoked on the client, for queries that were originally run on the server.
       */
      onHydrated(_k, info) {
        if (info.value) {
          hydrate(client(), {
            queries: [
              {
                queryKey: defaultedOptions.queryKey,
                queryHash: defaultedOptions.queryHash,
                state: info.value,
              },
            ],
          })
        }

        if (!unsubscribe) {
          /**
           * Do not refetch query on mount if query was fetched on server,
           * even if `staleTime` is not set.
           */
          const newOptions = { ...defaultedOptions }
          if (defaultedOptions.staleTime || !defaultedOptions.initialData) {
            newOptions.refetchOnMount = false
          }
          // Setting the options as an immutable object to prevent
          // wonky behavior with observer subscriptions
          observer.setOptions(newOptions)
          setState(observer.getOptimisticResult(newOptions))
          unsubscribe = createClientSubscriber()
        }
      },
    },
  )

  onCleanup(() => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  })

  createComputed(
    on(
      () => client().defaultQueryOptions(options()),
      () => observer.setOptions(client().defaultQueryOptions(options())),
      {
        // Defer because we don't need to trigger on first render
        // This only cares about changes to options after the observer is created
        defer: true,
      },
    ),
  )

  createComputed(
    on(
      () => state.status,
      () => {
        if (
          state.isError &&
          !state.isFetching &&
          shouldThrowError(observer.options.throwOnError, [
            state.error,
            observer.getCurrentQuery(),
          ])
        ) {
          throw state.error
        }
      },
    ),
  )

  const handler = {
    get(
      target: QueryObserverResult<TData, TError>,
      prop: keyof QueryObserverResult<TData, TError>,
    ): any {
      const val = queryResource()?.[prop]
      return val !== undefined ? val : Reflect.get(target, prop)
    },
  }

  return new Proxy(state, handler)
}
