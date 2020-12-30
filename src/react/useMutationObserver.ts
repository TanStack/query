import React from 'react'
import { notifyManager } from '../core/notifyManager'
import { noop } from '../core/utils'
import { MutationObserver } from '../core/mutationObserver'
import { useQueryClient } from './QueryClientProvider'
import { UseMutateFunction } from './types'
import { MutationObserverOptions, MutationObserverResult } from '../core/types'

export function useMutationObserver<TData, TError, TVariables, TContext>(
  options: MutationObserverOptions<TData, TError, TVariables, TContext>,
  Observer: typeof MutationObserver
) {
  const queryClient = useQueryClient()

  // Create mutation observer
  const observerRef = React.useRef<
    MutationObserver<TData, TError, TVariables, TContext>
  >()
  const observer =
    observerRef.current ||
    new Observer<TData, TError, TVariables, TContext>(queryClient, options)
  observerRef.current = observer

  // Update options
  if (observer.hasListeners()) {
    observer.setOptions(options)
  }

  const [currentResult, setCurrentResult] = React.useState(() =>
    observer.getCurrentResult()
  )

  // Subscribe to the observer
  React.useEffect(
    () =>
      observer.subscribe(
        notifyManager.batchCalls(
          (
            result: MutationObserverResult<TData, TError, TVariables, TContext>
          ) => {
            // Check if the component is still mounted
            if (observer.hasListeners()) {
              setCurrentResult(result)
            }
          }
        )
      ),
    [observer]
  )

  const mutate = React.useCallback<
    UseMutateFunction<TData, TError, TVariables, TContext>
  >(
    (variables, mutateOptions) => {
      observer.mutate(variables, mutateOptions).catch(noop)
    },
    [observer]
  )

  if (currentResult.error && observer.options.useErrorBoundary) {
    throw currentResult.error
  }

  return { ...currentResult, mutate, mutateAsync: currentResult.mutate }
}
