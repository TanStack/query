'use client'
import * as React from 'react'
import { MutationObserver, noop, notifyManager } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import type { UseMutationOptions, UseMutationResult } from './types'
import type { QueryClient } from '@tanstack/query-core'

type GetVariablesFn = (ctx: {
  index: number
  input: unknown
  prevData: unknown
  allData: Array<unknown>
}) => unknown | Promise<unknown>

export interface SequentialMutationConfig {
  options: UseMutationOptions<any, any, any, any>
  /**
   * Generate variables for each step dynamically.
   * If omitted, the previous step's result (prevData) is passed as the next mutation's variables.
   */
  getVariables?: GetVariablesFn
}

export interface UseSequentialMutationsOptions {
  mutations: ReadonlyArray<SequentialMutationConfig>
  /** Whether to stop the sequence on the first error. Default: true */
  stopOnError?: boolean
}

export interface UseSequentialMutationsResult {
  results: Array<UseMutationResult<any, any, any, any>>
  mutate: (input?: unknown) => void
  mutateAsync: (input?: unknown) => Promise<Array<unknown>>
}

export function useSequentialMutations(
  { mutations, stopOnError = true }: UseSequentialMutationsOptions,
  queryClient?: QueryClient,
): UseSequentialMutationsResult {
  const client = useQueryClient(queryClient)

  // Create observers for each step and keep them updated
  const observersRef = React.useRef<
    Array<MutationObserver<any, any, any, any>>
  >([])

  // Initialize observers once and when count increases
  if (observersRef.current.length !== mutations.length) {
    observersRef.current = mutations.map(
      (m, idx) =>
        observersRef.current[idx] ??
        new MutationObserver<any, any, any, any>(client, m.options as any),
    )
  }

  // Keep options in sync with latest configs
  React.useEffect(() => {
    observersRef.current.forEach((observer, idx) => {
      observer.setOptions(mutations[idx]!.options as any)
    })
  }, [mutations])

  // Keep latest config in a ref to avoid unstable callbacks from array identity changes
  const latestConfigRef = React.useRef<{
    mutations: ReadonlyArray<SequentialMutationConfig>
    stopOnError: boolean
  }>({ mutations, stopOnError })

  React.useEffect(() => {
    latestConfigRef.current = { mutations, stopOnError }
  }, [mutations, stopOnError])

  // Keep a cached snapshot to satisfy useSyncExternalStore contract
  const snapshotRef = React.useRef(
    observersRef.current.map((o) => o.getCurrentResult()),
  )

  const observerCount = observersRef.current.length

  const observerResults = React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => {
        const batched = notifyManager.batchCalls(onStoreChange)
        // initialize snapshot for new subscription cycle (e.g., when mutations length changes)
        snapshotRef.current = observersRef.current.map((o) =>
          o.getCurrentResult(),
        )
        const unsubscribers = observersRef.current.map((observer) =>
          observer.subscribe(() => {
            snapshotRef.current = observersRef.current.map((o) =>
              o.getCurrentResult(),
            )
            batched()
          }),
        )
        // trigger one update so that consumers pick up the new snapshot once
        batched()
        return () => {
          unsubscribers.forEach((u) => u())
        }
      },
      [observerCount],
    ),
    () => snapshotRef.current,
    () => snapshotRef.current,
  )

  const results: Array<UseMutationResult<any, any, any, any>> = React.useMemo(
    () =>
      observerResults.map((r, idx) => ({
        ...r,
        mutate: (variables: any, mutateOptions?: any) =>
          observersRef.current[idx]!.mutate(variables, mutateOptions).catch(
            noop,
          ),
        mutateAsync: observersRef.current[idx]!.mutate,
      })),
    [observerResults],
  )

  const mutateAsync = React.useCallback(async (input?: unknown) => {
    const { mutations: currentMutations, stopOnError: currentStopOnError } =
      latestConfigRef.current
    const outputs: Array<unknown> = []
    let prevData: unknown = undefined
    for (let i = 0; i < observersRef.current.length; i++) {
      const step = currentMutations[i]!
      const getVariables = step.getVariables
      const variables = getVariables
        ? await getVariables({ index: i, input, prevData, allData: outputs })
        : prevData
      try {
        const data = await observersRef.current[i]!.mutate(variables as any)
        outputs.push(data)
        prevData = data
      } catch (error) {
        if (currentStopOnError) {
          throw error
        }
        outputs.push(error)
        prevData = undefined
      }
    }
    return outputs
  }, [])

  const mutate = React.useCallback(
    (input?: unknown) => {
      void mutateAsync(input).catch(noop)
    },
    [mutateAsync],
  )

  return { results, mutate, mutateAsync }
}
