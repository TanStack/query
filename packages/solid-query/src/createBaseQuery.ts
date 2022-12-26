import type { QueryObserver } from '@tanstack/query-core'
import type { QueryKey, QueryObserverResult } from '@tanstack/query-core'
import type { CreateBaseQueryOptions } from './types'
import { useQueryClient } from './QueryClientProvider'
import {
  onMount,
  onCleanup,
  createComputed,
  createResource,
  on,
  batch,
} from 'solid-js'
import { createStore, unwrap } from 'solid-js/store'
import { shouldThrowError } from './utils'

// Base Query Function that is used to create the query.
export function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: CreateBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver,
): QueryObserverResult<TData, TError> {
  const queryClient = useQueryClient({ context: options.context })
  const emptyData = Symbol('empty')
  const defaultedOptions = queryClient.defaultQueryOptions(options)
  defaultedOptions._optimisticResults = 'optimistic'
  const observer = new Observer(queryClient, defaultedOptions)

  const [state, setState] = createStore<QueryObserverResult<TData, TError>>(
    // @ts-ignore
    observer.getOptimisticResult(defaultedOptions),
  )

  const [dataResource, { refetch, mutate }] = createResource<TData | undefined>(
    () => {
      return new Promise((resolve) => {
        if (!(state.isFetching && state.isLoading)) {
          if (unwrap(state.data) === emptyData) {
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

  let taskQueue: Array<() => void> = []

  const unsubscribe = observer.subscribe((result) => {
    taskQueue.push(() => {
      batch(() => {
        const unwrappedResult = { ...unwrap(result) }
        if (unwrappedResult.data === undefined) {
          // This is a hack to prevent Solid
          // from deleting the data property when it is `undefined`
          // ref: https://www.solidjs.com/docs/latest/api#updating-stores
          // @ts-ignore
          unwrappedResult.data = emptyData
        }
        setState(unwrap(unwrappedResult))
        mutate(() => unwrap(result.data))
        refetch()
      })
    })

    queueMicrotask(() => {
      const taskToRun = taskQueue.pop()
      if (taskToRun) {
        taskToRun()
      }
      taskQueue = []
    })
  })

  onCleanup(() => unsubscribe())

  onMount(() => {
    observer.setOptions(defaultedOptions, { listeners: false })
  })

  createComputed(() => {
    const newDefaultedOptions = queryClient.defaultQueryOptions(options)
    observer.setOptions(newDefaultedOptions)
  })

  createComputed(
    on(
      () => state.status,
      () => {
        if (
          state.isError &&
          !state.isFetching &&
          shouldThrowError(observer.options.useErrorBoundary, [
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

  return new Proxy(state, handler) as QueryObserverResult<TData, TError>
}
