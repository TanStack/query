import { QueryObserver } from '@tanstack/query-core'
import type { QueryKey, QueryObserverResult } from '@tanstack/query-core'
import { CreateBaseQueryOptions } from './types'
import { useQueryClient } from './QueryClientProvider'
import { onMount, onCleanup, createComputed, createResource } from 'solid-js'
import { createStore } from 'solid-js/store'

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

  const defaultedOptions = queryClient.defaultQueryOptions(options)
  defaultedOptions._optimisticResults = 'optimistic'
  const observer = new Observer(queryClient, defaultedOptions)

  const [state, setState] = createStore<QueryObserverResult<TData, TError>>(
    // @ts-ignore
    observer.getOptimisticResult(defaultedOptions),
  )

  const [dataResource, { refetch }] = createResource<TData | undefined>(() => {
    return new Promise((resolve) => {
      if (state.isSuccess) resolve(state.data)
      if (state.isError && !state.isFetching) {
        throw state.error
      }
    })
  })

  const unsubscribe = observer.subscribe((result) => {
    setState(result)
    refetch()
  })

  onCleanup(() => unsubscribe())

  onMount(() => {
    observer.setOptions(defaultedOptions, { listeners: false })
  })

  createComputed(() => {
    const newDefaultedOptions = queryClient.defaultQueryOptions(options)
    observer.setOptions(newDefaultedOptions)
  })

  const handler = {
    get(
      target: QueryObserverResult<TData, TError>,
      prop: keyof QueryObserverResult<TData, TError>,
    ): any {
      if (prop === 'data') {
        if (state.isLoading) {
          return dataResource()
        }
        return state.data
      }
      return Reflect.get(target, prop)
    },
  }

  const proxyResult = new Proxy(state, handler) as QueryObserverResult<
    TData,
    TError
  >

  return !defaultedOptions.notifyOnChangeProps
    ? observer.trackResult(proxyResult)
    : proxyResult
}
