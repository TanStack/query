import type { NoSerialize } from '@builder.io/qwik'
import {
  noSerialize,
  useSignal,
  useStore,
  useVisibleTask$,
} from '@builder.io/qwik'
import type { DefaultError } from '@tanstack/query-core'
import { MutationObserver, notifyManager } from '@tanstack/query-core'
import { createQueryClient } from './useQueryClient'
import type { UseMutationOptions, UseMutationResult } from './types'

export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> & {
  options: UseMutationOptions<TData, TError, TVariables, TContext>
}

export function useMutation(
  options: any /*UseMutationOptions*/,
): any /*UseMutationResult & {
  options: UseMutationOptions
}*/ {
  const store = useStore<any>({})
  const observerSig = useSignal<NoSerialize<MutationObserver>>()

  useVisibleTask$(({ cleanup }) => {
    const { observer, unsubscribe } = createMutationObserver(store, options)
    observerSig.value = observer

    cleanup(unsubscribe)
  })

  useVisibleTask$(({ track }) => {
    track(() => store.options)
    console.log('mutation: useVisibleTask$ store.options')
    if (observerSig.value) {
      observerSig.value.setOptions(options)
    }
  })

  return store
}

const createMutationObserver = (store: any, options: any) => {
  const client = createQueryClient()
  const observer = new MutationObserver(client, options)

  const unsubscribe = observer.subscribe(
    notifyManager.batchCalls((result: any) => {
      store.result = noSerialize(observer.getCurrentResult())
      store.mutateAsync = noSerialize(result.mutate)
    }),
  )

  store.mutate = noSerialize((variables: any, mutateOptions: any) => {
    console.log('mutation: observer.mutate')
    observer.mutate(variables, mutateOptions).catch(() => {})
  })

  return { observer: noSerialize(observer), unsubscribe }
}
