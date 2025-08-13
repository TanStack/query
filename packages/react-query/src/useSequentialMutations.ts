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

export interface SequentialMutationConfig<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown,
> {
  options: UseMutationOptions<TData, TError, TVariables, TContext>
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

type StepResults<
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

// Derive an array of step data types from the provided steps
type StepDataArray<
  TSteps extends ReadonlyArray<SequentialMutationConfig<any, any, any, any>>,
> = {
  [K in keyof TSteps]: TSteps[K] extends SequentialMutationConfig<
    infer TData,
    any,
    any,
    any
  >
    ? TData
    : never
}

// Output array type for mutateAsync: each entry is either the step's data or an Error (when stopOnError=false)
type StepOutput<
  TSteps extends ReadonlyArray<SequentialMutationConfig<any, any, any, any>>,
> = Array<StepDataArray<TSteps>[number] | Error>

export interface UseSequentialMutationsResult<
  TSteps extends ReadonlyArray<
    SequentialMutationConfig<any, any, any, any>
  > = ReadonlyArray<SequentialMutationConfig<any, any, any, any>>,
> {
  results: StepResults<TSteps>
  currentIndex: number
  isLoading: boolean
  error: unknown | null
  reset: () => void
  mutate: (
    input?: unknown,
    stepOptions?:
      | Array<MutateOptions<any, any, any, any> | undefined>
      | ((index: number) => MutateOptions<any, any, any, any> | undefined),
  ) => void
  mutateAsync: (
    input?: unknown,
    stepOptions?:
      | Array<MutateOptions<any, any, any, any> | undefined>
      | ((index: number) => MutateOptions<any, any, any, any> | undefined),
  ) => Promise<StepOutput<TSteps>>
}

export function useSequentialMutations<
  TSteps extends ReadonlyArray<SequentialMutationConfig<any, any, any, any>>,
>(
  { mutations, stopOnError = true }: UseSequentialMutationsOptions<TSteps>,
  queryClient?: QueryClient,
): UseSequentialMutationsResult<TSteps> {
  const client = useQueryClient(queryClient)

  const [currentIndex, setCurrentIndex] = React.useState<number>(-1)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<unknown | null>(null)

  const observersRef = React.useRef<
    Array<MutationObserver<any, any, any, any>>
  >([])

  // Ensure observers array length matches mutations length synchronously during render
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
  const initialSnapshot = observersRef.current.map((o) => o.getCurrentResult())
  // Only replace if it differs to avoid unnecessary identity changes
  if (snapshotRef.current.length !== initialSnapshot.length) {
    snapshotRef.current = initialSnapshot
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
        mutate: (variables: unknown, mutateOptions?: unknown) =>
          observersRef.current[idx]!.mutate(
            variables as any,
            mutateOptions as any,
          ).catch(noop),
        mutateAsync: observersRef.current[idx]!.mutate,
      })),
    [observerResults],
  ) as unknown as StepResults<TSteps>

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
      _input?: unknown,
      stepOptions?:
        | Array<MutateOptions<any, any, any, any> | undefined>
        | ((index: number) => MutateOptions<any, any, any, any> | undefined),
    ) => {
      // Early return if component is already unmounted
      if (!isMountedRef.current) {
        return [] as StepOutput<TSteps>
      }

      // Create abort controller for this operation
      const abortController = new AbortController()
      activeControllersRef.current.add(abortController)

      try {
        setError(null)
        setIsLoading(true)
        const { mutations: currentMutations, stopOnError: currentStopOnError } =
          latestConfigRef.current
        const outputs = [] as unknown as StepOutput<TSteps>
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

          // keep current step reference for readability (no-op)
          currentMutations[i]!
          const variables = prevData

          setCurrentIndex(i)

          // Check abort/unmount state again after getVariables
          if (abortController.signal.aborted || !isMountedRef.current) {
            break
          }

          // Resolve call-time mutate options for this step
          const resolveStepOptions = () => {
            if (!stepOptions) return undefined
            if (typeof stepOptions === 'function') {
              return (
                stepOptions as (
                  index: number,
                ) => MutateOptions<any, any, any, any> | undefined
              )(i)
            }
            return Array.isArray(stepOptions)
              ? (stepOptions[i] as
                  | MutateOptions<any, any, any, any>
                  | undefined)
              : undefined
          }

          try {
            const data = (await observersRef.current[i]!.mutate(
              variables as any,
              resolveStepOptions() as any,
            )) as StepDataArray<TSteps>[number]

            // Check abort/unmount state after mutation completes
            if (abortController.signal.aborted || !isMountedRef.current) {
              break
            }

            outputs.push(data)
            prevData = data
          } catch (err) {
            // Check abort/unmount state before handling error
            if (abortController.signal.aborted || !isMountedRef.current) {
              break
            }

            if (currentStopOnError) {
              setError(err)
              setIsLoading(false)
              setCurrentIndex(-1)
              throw err
            }
            outputs.push(err as Error)
            prevData = undefined
          }
        }
        return outputs
      } finally {
        // Clean up this controller
        activeControllersRef.current.delete(abortController)
        setIsLoading(false)
        setCurrentIndex(-1)
      }
    },
    [],
  )

  const mutate = React.useCallback(
    (
      input?: unknown,
      stepOptions?:
        | Array<MutateOptions<any, any, any, any> | undefined>
        | ((index: number) => MutateOptions<any, any, any, any> | undefined),
    ) => {
      void mutateAsync(input, stepOptions).catch(noop)
    },
    [mutateAsync],
  )

  const reset = React.useCallback(() => {
    activeControllersRef.current.forEach((controller) => controller.abort())
    activeControllersRef.current.clear()
    setCurrentIndex(-1)
    setIsLoading(false)
    setError(null)
  }, [])

  return { results, currentIndex, isLoading, error, reset, mutate, mutateAsync }
}
