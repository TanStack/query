'use client'
import * as React from 'react'
import {
  MutationObserver,
  noop,
  notifyManager,
  replaceEqualDeep,
} from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import type { UseMutationOptions, UseMutationResult } from './types'
import type { QueryClient, MutateOptions } from '@tanstack/query-core'

type GetVariablesContext = {
  index: number
  input: unknown
  prevData: unknown
  allData: Array<unknown>
}

export interface SequentialMutationConfig<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown,
> {
  options: UseMutationOptions<TData, TError, TVariables, TContext>
  /**
   * Generate variables for each step dynamically.
   * If omitted, the previous step's result (prevData) is passed as the next mutation's variables.
   */
  getVariables?: (ctx: GetVariablesContext) => TVariables | Promise<TVariables>
}

export interface UseSequentialMutationsOptions<
  TSteps extends ReadonlyArray<
    SequentialMutationConfig<any, any, any, any>
  > = ReadonlyArray<SequentialMutationConfig<any, any, any, any>>,
> {
  mutations: TSteps
  /** Whether to stop the sequence on the first error. Default: true */
  stopOnError?: boolean
}

type ResultsForSteps<
  TSteps extends ReadonlyArray<SequentialMutationConfig<any, any, any, any>>,
> = {
  [K in keyof TSteps]: TSteps[K] extends SequentialMutationConfig<
    infer TData,
    infer TError,
    infer TVariables,
    infer TContext
  >
    ? UseMutationResult<TData, TError, TVariables, TContext>
    : never
}

export interface UseSequentialMutationsResult<
  TSteps extends ReadonlyArray<
    SequentialMutationConfig<any, any, any, any>
  > = ReadonlyArray<SequentialMutationConfig<any, any, any, any>>,
> {
  results: ResultsForSteps<TSteps>
  mutate: (
    input?: unknown,
    stepOptions?:
      | PartialStepMutateOptions<TSteps>
      | StepMutateOptionsFn<TSteps>,
  ) => void
  mutateAsync: (
    input?: unknown,
    stepOptions?:
      | PartialStepMutateOptions<TSteps>
      | StepMutateOptionsFn<TSteps>,
  ) => Promise<Array<unknown>>
}

type StepMutateOptionsForConfig<Cfg> =
  Cfg extends SequentialMutationConfig<
    infer TData,
    infer TError,
    infer TVariables,
    infer TContext
  >
    ? MutateOptions<TData, TError, TVariables, TContext>
    : never

type PartialStepMutateOptions<
  TSteps extends ReadonlyArray<SequentialMutationConfig<any, any, any, any>>,
> = Partial<{ [K in keyof TSteps]: StepMutateOptionsForConfig<TSteps[K]> }>

type StepMutateOptionsFn<
  TSteps extends ReadonlyArray<SequentialMutationConfig<any, any, any, any>>,
> = (index: number) => StepMutateOptionsForConfig<TSteps[number]> | undefined

export function useSequentialMutations<
  TSteps extends ReadonlyArray<SequentialMutationConfig<any, any, any, any>>,
>(
  { mutations, stopOnError = true }: UseSequentialMutationsOptions<TSteps>,
  queryClient?: QueryClient,
): UseSequentialMutationsResult<TSteps> {
  const client = useQueryClient(queryClient)

  // Create observers for each step and keep them updated
  const observersRef = React.useRef<
    Array<MutationObserver<any, any, any, any>>
  >([])

  // Ensure observers array length matches mutations length synchronously during render
  {
    const currentObservers = observersRef.current
    const targetLength = mutations.length

    if (currentObservers.length !== targetLength) {
      const newObservers = currentObservers.slice(0, targetLength)
      for (let i = currentObservers.length; i < targetLength; i++) {
        newObservers[i] = new MutationObserver<any, any, any, any>(
          client,
          mutations[i]!.options as any,
        )
      }
      observersRef.current = newObservers
    }
  }

  // Keep options in sync with latest configs
  React.useEffect(() => {
    observersRef.current.forEach((observer, idx) => {
      observer.setOptions(mutations[idx]!.options as any)
    })
  }, [mutations])

  // Keep latest config in a ref to avoid unstable callbacks from array identity changes
  const latestConfigRef = React.useRef<{
    mutations: TSteps
    stopOnError: boolean
  }>({ mutations, stopOnError })

  React.useEffect(() => {
    latestConfigRef.current = { mutations, stopOnError }
  }, [mutations, stopOnError])

  // Track observer count for stable dependency
  const observerCount = observersRef.current.length

  // Keep a cached snapshot to satisfy useSyncExternalStore contract
  // Use MutationObserverResult type for raw observer results
  const snapshotRef = React.useRef<Array<any>>([])

  // Initialize snapshot synchronously so first render has correct results length
  {
    const initialSnapshot = observersRef.current.map((o) =>
      o.getCurrentResult(),
    )
    // Only replace if it differs to avoid unnecessary identity changes
    if (snapshotRef.current.length !== initialSnapshot.length) {
      snapshotRef.current = initialSnapshot
    }
  }

  const observerResults = React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => {
        const batched = notifyManager.batchCalls(onStoreChange)

        // Initialize snapshot with current results
        const getCurrentSnapshot = () =>
          observersRef.current.map((o) => o.getCurrentResult())

        // Optimized update function that only triggers if results actually changed
        const updateSnapshot = () => {
          const newSnapshot = getCurrentSnapshot()
          const nextSnapshot = replaceEqualDeep(
            snapshotRef.current,
            newSnapshot,
          )

          if (nextSnapshot !== snapshotRef.current) {
            snapshotRef.current = nextSnapshot
            batched()
          }
        }

        // Set initial snapshot
        snapshotRef.current = getCurrentSnapshot()

        // Subscribe to all observers
        const unsubscribers = observersRef.current.map((observer) =>
          observer.subscribe(updateSnapshot),
        )

        // Trigger initial update for new subscription cycle
        batched()

        return () => {
          unsubscribers.forEach((unsubscribe) => unsubscribe())
        }
      },
      // Only recreate subscription when observer count changes
      [observerCount],
    ),
    () => snapshotRef.current,
    () => observersRef.current.map((o) => o.getCurrentResult()),
  )

  const results = React.useMemo(
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
  ) as unknown as ResultsForSteps<TSteps>

  // Track mount state for cleanup during async operations
  const isMountedRef = React.useRef(true)

  // Track active abort controllers for cleanup
  const activeControllersRef = React.useRef<Set<AbortController>>(new Set())

  // Cleanup on unmount
  React.useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Abort all active operations on unmount
      activeControllersRef.current.forEach((controller) => {
        controller.abort()
      })
      activeControllersRef.current.clear()
    }
  }, [])

  const mutateAsync = React.useCallback(
    async (
      input?: unknown,
      stepOptions?:
        | PartialStepMutateOptions<TSteps>
        | StepMutateOptionsFn<TSteps>,
    ) => {
      // Early return if component is already unmounted
      if (!isMountedRef.current) {
        return []
      }

      // Create abort controller for this operation
      const abortController = new AbortController()
      activeControllersRef.current.add(abortController)

      try {
        const { mutations: currentMutations, stopOnError: currentStopOnError } =
          latestConfigRef.current
        const outputs: Array<unknown> = []
        let prevData: unknown = undefined

        // Safety: iterate only up to the minimum length of observers and mutations
        const stepsLength = Math.min(
          observersRef.current.length,
          currentMutations.length,
        )
        for (let i = 0; i < stepsLength; i++) {
          // Check if operation was aborted or component unmounted
          if (abortController.signal.aborted || !isMountedRef.current) {
            break
          }

          const step = currentMutations[i]!
          const getVariables = step.getVariables

          let variables: unknown
          try {
            variables = getVariables
              ? await getVariables({
                  index: i,
                  input,
                  prevData,
                  allData: outputs,
                })
              : prevData
          } catch (error) {
            // Check abort/unmount state after async getVariables
            if (abortController.signal.aborted || !isMountedRef.current) {
              break
            }
            if (currentStopOnError) {
              throw error
            }
            outputs.push(error)
            prevData = undefined
            continue
          }

          // Check abort/unmount state again after getVariables
          if (abortController.signal.aborted || !isMountedRef.current) {
            break
          }

          // Resolve call-time mutate options for this step
          const resolveStepOptions = () => {
            if (!stepOptions) return undefined
            if (typeof stepOptions === 'function') {
              return (stepOptions as StepMutateOptionsFn<TSteps>)(i)
            }
            return (stepOptions as PartialStepMutateOptions<TSteps>)[
              i as keyof PartialStepMutateOptions<TSteps>
            ] as unknown
          }

          try {
            const data = await observersRef.current[i]!.mutate(
              variables as any,
              resolveStepOptions() as any,
            )

            // Check abort/unmount state after mutation completes
            if (abortController.signal.aborted || !isMountedRef.current) {
              break
            }

            outputs.push(data)
            prevData = data
          } catch (error) {
            // Check abort/unmount state before handling error
            if (abortController.signal.aborted || !isMountedRef.current) {
              break
            }

            if (currentStopOnError) {
              throw error
            }
            outputs.push(error)
            prevData = undefined
          }
        }
        return outputs
      } finally {
        // Clean up this controller
        activeControllersRef.current.delete(abortController)
      }
    },
    [],
  )

  const mutate = React.useCallback(
    (
      input?: unknown,
      stepOptions?:
        | PartialStepMutateOptions<TSteps>
        | StepMutateOptionsFn<TSteps>,
    ) => {
      void mutateAsync(input, stepOptions).catch(noop)
    },
    [mutateAsync],
  )

  return { results, mutate, mutateAsync }
}
