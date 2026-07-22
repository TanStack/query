// `useMutation` — reimplemented on octane's hooks, mirroring
// @tanstack/react-query: a MutationObserver subscribed via useSyncExternalStore,
// with a stable `mutate` callback. The single compiler-injected slot is split
// into distinct sub-slots for each internal base hook.
import { useCallback, useEffect, useState, useSyncExternalStore } from 'octane'
import {
  MutationObserver,
  noop,
  notifyManager,
  shouldThrowError,
} from '@tanstack/query-core'
import { resolveClient } from './context'
import { splitSlot, subSlot as subSlotBase } from './internal'
import type { DefaultError, QueryClient } from '@tanstack/query-core'
import type { UseMutationOptions, UseMutationResult } from './types'

// Namespaced per-hook (':om:') on top of the shared helper — the minted symbols
// are byte-identical to the previous private copy, so slot identity is stable.
const subSlot = (slot: symbol | undefined, tag: string) =>
  subSlotBase(slot, 'om:' + tag)

// Signature matches @tanstack/react-query's useMutation.ts.
export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  queryClient?: QueryClient,
): UseMutationResult<TData, TError, TVariables, TOnMutateResult>

export function useMutation(options: any, ...rest: Array<any>): any {
  const [user, slot] = splitSlot(rest)
  const client = resolveClient(user[0])

  const [observer] = useState(
    () => new MutationObserver(client, options),
    subSlot(slot, 'obs'),
  )

  useEffect(
    () => {
      observer.setOptions(options)
    },
    [observer, options],
    subSlot(slot, 'eff'),
  )

  const result = useSyncExternalStore(
    useCallback(
      (onStoreChange: () => void) =>
        observer.subscribe(notifyManager.batchCalls(onStoreChange)),
      [observer],
      subSlot(slot, 'cb'),
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult(),
    subSlot(slot, 'uses'),
  )

  const mutate = useCallback(
    (variables: any, mutateOptions: any) => {
      observer.mutate(variables, mutateOptions).catch(noop)
    },
    [observer],
    subSlot(slot, 'mut'),
  )

  if (
    result.error &&
    shouldThrowError(observer.options.throwOnError, [result.error])
  ) {
    throw result.error
  }

  return { ...result, mutate, mutateAsync: result.mutate }
}
