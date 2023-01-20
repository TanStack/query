import type {
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'
import { notifyManager } from '@tanstack/query-core'
import type { Accessor } from 'solid-js'
import {
  batch,
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
  queryClient?: () => QueryClient,
) {
  const client = createMemo(() => useQueryClient(queryClient?.()))
  const emptyData = Symbol('empty')

  const defaultedOptions = client().defaultQueryOptions(options())
  defaultedOptions._optimisticResults = 'optimistic'
  const observer = new Observer(client(), defaultedOptions)

  const [state, setState] = createStore<QueryObserverResult<TData, TError>>(
    observer.getOptimisticResult(defaultedOptions),
  )

  const [dataResource, { refetch, mutate }] = createResource<TData | undefined>(
    () => {
      return new Promise((resolve) => {
        if (!(state.isFetching && state.isLoading)) {
          if ((unwrap(state.data) as TData | typeof emptyData) === emptyData) {
            resolve(undefined)
          }
          resolve(unwrap(state.data))
        }
      })
    },
  )

  batch(() => {
    mutate(() => unwrap(state.data))
    refetch()
  })

  const unsubscribe = observer.subscribe((result) => {
    notifyManager.batchCalls(() => {
      const unwrappedResult = { ...unwrap(result) }
      if (unwrappedResult.data === undefined) {
        // This is a hack to prevent Solid
        // from deleting the data property when it is `undefined`
        // ref: https://www.solidjs.com/docs/latest/api#updating-stores
        unwrappedResult.data = emptyData as any as undefined
      }
      setState(unwrap(unwrappedResult))
      mutate(() => unwrap(result.data))
      refetch()
    })()
  })

  onCleanup(() => unsubscribe())

  onMount(() => {
    observer.setOptions(defaultedOptions, { listeners: false })
  })

  createComputed(() => {
    observer.setOptions(client().defaultQueryOptions(options()))
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
