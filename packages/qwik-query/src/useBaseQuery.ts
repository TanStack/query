import {
  noSerialize,
  useSignal,
  useStore,
  useVisibleTask$,
  type NoSerialize,
} from '@builder.io/qwik'
import {
  DefaultedQueryObserverOptions,
  InfiniteQueryObserver,
  QueryClient,
  QueryKey,
  QueryObserver,
  hydrate,
  notifyManager,
  type DehydratedState
} from '@tanstack/query-core'
import { QueryStore } from './types'
import { createQueryClient } from './useQueryClient'

export enum ObserverType {
  base,
  inifinite,
}

export const useBaseQuery = (
  observerType: ObserverType,
  options: any,
  // | DefaultedQueryObserverOptions<unknown, Error, unknown, unknown, QueryKey>
  // | InfiniteQueryObserverOptions<unknown, Error, unknown, unknown, QueryKey>,
  initialState?: DehydratedState,
) => {
  const queryClient = new QueryClient()
  if (initialState) {
    hydrate(queryClient, initialState)
  }
  const store = useStore<any>({ //QueryStore
    result: initialState
      ? queryClient.getQueryState(options.queryKey || [])
      : undefined,
    options,
  })
  const observerSig = useSignal<NoSerialize<QueryObserver>>()

  useVisibleTask$(
    ({ cleanup }) => {
      const { observer, unsubscribe, defaultedOptions } = createQueryObserver(
        store,
        options,
        observerType,
      )
      observerSig.value = observer
      store.options = defaultedOptions

      cleanup(unsubscribe)
    },
    { strategy: 'document-ready' },
  )

  useVisibleTask$(({ track }) => {
    track(() => store.options)
    if (observerSig.value) {
      observerSig.value.setOptions(store.options || options)
    }
  })

  return store
}

const createQueryObserver = (
  store: QueryStore,
  options: DefaultedQueryObserverOptions<
    unknown,
    Error,
    unknown,
    unknown,
    QueryKey
  >,
  observerType: ObserverType,
) => {
  const Observer =
    observerType === ObserverType.base
      ? QueryObserver
      : (InfiniteQueryObserver as typeof QueryObserver)
  const client = createQueryClient()

  const defaultedOptions = client.defaultQueryOptions(options)
  defaultedOptions._optimisticResults = 'optimistic'
  defaultedOptions.structuralSharing = false

  const observer = new Observer(client, defaultedOptions)
  if (!store.result) {
    const result = observer.getOptimisticResult(defaultedOptions)
    store.result = !defaultedOptions.notifyOnChangeProps
      ? noSerialize(observer.trackResult(result))
      : noSerialize(result)
  }

  const unsubscribe = observer.subscribe(
    notifyManager.batchCalls((result: any) => {
      store.result = !defaultedOptions.notifyOnChangeProps
        ? noSerialize(observer.trackResult(result))
        : noSerialize(result)
    }),
  )

  return { observer: noSerialize(observer), unsubscribe, defaultedOptions }
}
