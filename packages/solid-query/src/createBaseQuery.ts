/* eslint-disable @typescript-eslint/no-unnecessary-condition */
// Had to disable the lint rule because isServer type is defined as false
// in solid-js/web package. I'll create a GitHub issue with them to see
// why that happens.
import type {
  QueryKey,
  QueryObserver,
  QueryObserverResult,
  DehydratedState,
} from '@tanstack/query-core'
import { hydrate, dehydrate } from '@tanstack/query-core'
import { notifyManager } from '@tanstack/query-core'
import type { Accessor } from 'solid-js'
import { isServer } from 'solid-js/web'
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
) {
  const queryClient = createMemo(() =>
    useQueryClient({ context: options().context }),
  )

  const emptyData = Symbol('empty')

  let resolver: (value: TData | undefined) => void
  let queryResolver: (value: DehydratedState) => void

  // This resource will be used in a Server environment to
  // dehydrate the queryClient when the query is
  // pre fetched on the server. It will always be undefined
  // if an observer is mounted on client.
  const [queryResource] = createResource<DehydratedState | undefined>(() => {
    return new Promise((resolve) => {
      if (!isServer) {
        resolve(undefined)
      }
      queryResolver = resolve
    })
  })

  // If queryResource is defined,
  // This means that the query was fetched on the server!
  // We need to hydrate the queryClient with the query from
  // the server before we set up the observer and its results.
  if (!isServer && queryResource()) {
    hydrate(queryClient(), queryResource())
  }

  const defaultedOptions = queryClient().defaultQueryOptions(options())
  defaultedOptions._optimisticResults = 'optimistic'
  if (!isServer && queryResource()) {
    defaultedOptions.refetchOnMount = false
  }
  const observer = new Observer(queryClient(), defaultedOptions)

  const [state, setState] = createStore<QueryObserverResult<TData, TError>>(
    observer.getOptimisticResult(defaultedOptions),
  )

  const [dataResource, { mutate, refetch }] = createResource<TData | undefined>(
    () => {
      return new Promise((resolve) => {
        if (isServer) {
          if (!state.isInitialLoading) {
            const dehydratedClient = dehydrate(queryClient())
            queryResolver?.(dehydratedClient)
            resolve(unwrap(state.data))
          }
          // We only resolve the data resource
          // when the query observer finds a result
          // This function will be called inside the observer
          // subscription function.
          resolver = resolve
        } else {
          if (!state.isInitialLoading) {
            if (
              (unwrap(state.data) as TData | typeof emptyData) === emptyData
            ) {
              resolve(undefined)
            }
            resolve(unwrap(state.data))
          }
        }
      })
    },
    {
      get deferStream() {
        return options().deferStream
      },
    },
  )

  if (!isServer) {
    batch(() => {
      mutate(() => unwrap(state.data))
      refetch()
    })
  }

  const unsubscribe = observer.subscribe((result) => {
    notifyManager.batchCalls(() => {
      const unwrappedResult = { ...unwrap(result) }
      if (isServer) {
        setState(unwrappedResult)
        // If on the server, we dehydrate the queryclient resource
        // So that it is available to be hydrated on the client
        if (!result.isInitialLoading) {
          const dehydratedClient = dehydrate(queryClient())
          queryResolver?.(dehydratedClient)
          resolver?.(unwrap(unwrappedResult.data))
        }
      } else {
        if (unwrappedResult.data === undefined) {
          // This is a hack to prevent Solid
          // from deleting the data property when it is `undefined`
          // ref: https://www.solidjs.com/docs/latest/api#updating-stores
          unwrappedResult.data = emptyData as any as undefined
        }
        setState(unwrap(unwrappedResult))
        mutate(() => unwrap(result.data))
        refetch()
      }
    })()
  })

  onCleanup(() => unsubscribe())

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
