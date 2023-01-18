/* eslint-disable @typescript-eslint/no-unnecessary-condition */
// Had to disable the lint rule because isServer type is defined as false
// in solid-js/web package. I'll create a GitHub issue with them to see
// why that happens.
import type {
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'
import { notifyManager } from '@tanstack/query-core'
import type { Accessor } from 'solid-js'
import { isServer } from 'solid-js/web'
import {
  createComputed,
  createMemo,
  createResource,
  on,
  onCleanup,
  onMount,
} from 'solid-js'
import { createStore, unwrap } from 'solid-js/store'
import { useQueryClient } from './QueryClientProvider'
import type { CreateBaseQueryOptions } from './types'
import { shouldThrowError } from './utils'

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
) {
  const queryClient = createMemo(() =>
    useQueryClient({ context: options().context }),
  )

  const defaultedOptions = queryClient().defaultQueryOptions(options())
  defaultedOptions._optimisticResults = 'optimistic'
  const observer = new Observer(queryClient(), defaultedOptions)

  const emptyData = Symbol('empty')

  const [state, setState] = createStore<QueryObserverResult<TData, TError>>(
    observer.getOptimisticResult(defaultedOptions),
  )

  const createServerSubscriber = (
    resolve: (data: TData | PromiseLike<TData | undefined> | undefined) => void,
    reject: (reason?: unknown) => void,
  ) => {
    return observer.subscribe((result) => {
      notifyManager.batchCalls(() => {
        const unwrappedResult = { ...unwrap(result) }

        setState(unwrappedResult)
        if (!result.isInitialLoading) {
          if (result.isError) {
            reject(unwrappedResult.error)
          } else {
            resolve(unwrap(unwrappedResult.data))
          }
        }
      })()
    })
  }

  const createClientSubscriber = (refetch: () => void) => {
    return observer.subscribe((result) => {
      notifyManager.batchCalls(() => {
        const unwrappedResult = { ...unwrap(result) }

        if (unwrappedResult.data === undefined) {
          // This is a hack to prevent Solid
          // from deleting the data property when it is `undefined`
          // ref: https://www.solidjs.com/docs/latest/api#updating-stores
          unwrappedResult.data = emptyData as any as undefined
        }

        setState(unwrap(unwrappedResult))
        if (refetch) {
          refetch()
        }
      })()
    })
  }

  let unsubscribe: (() => void) | null = null
  const [dataResource, { refetch }] = createResource<TData | undefined>(
    () => {
      return new Promise((resolve, reject) => {
        if (isServer) {
          unsubscribe = createServerSubscriber(resolve, reject)
        } else {
          if (!unsubscribe) {
            unsubscribe = createClientSubscriber(() => refetch())
          }

          if (!state.isInitialLoading) {
            if (state.isError) {
              reject(state.error)
            } else {
              const unwrappedData = unwrap(state.data)
              if ((unwrappedData as TData | typeof emptyData) === emptyData) {
                resolve(undefined)
              }

              resolve(unwrappedData)
            }
          }
        }
      })
    },
    {
      get deferStream() {
        return options().deferStream
      },

      /**
       * If this resource was populated on the server (either sync render, or streamed in over time), onHydrated
       * will be called. This is the point at which we can "hydrate" the query cache, and setup the query subscriber.
       *
       * Leveraging onHydrated allows us to plug into the async and streaming support that solidjs resources already support.
       */
      onHydrated(_k, info) {
        if (defaultedOptions.queryKey) {
          queryClient().setQueryData(defaultedOptions.queryKey, info.value)
        }

        unsubscribe = createClientSubscriber(() => refetch())
      },
    },
  )

  onCleanup(() => {
    if (!isServer && unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  })

  onMount(() => {
    observer.setOptions(defaultedOptions, { listeners: false })
  })

  createComputed(() => {
    observer.setOptions(queryClient().defaultQueryOptions(options()))
  })

  createComputed(
    on(
      () => state.status,
      () => {
        if (
          state.isError &&
          !state.isFetching &&
          shouldThrowError(observer.options.throwErrors, [
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
      if (prop === 'data') {
        return dataResource()
      }
      return Reflect.get(target, prop)
    },
  }

  return new Proxy(state, handler)
}
