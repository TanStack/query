import React from 'react'

import { useMountedCallback } from './utils'
import { getStatusProps } from '../core/utils'
import { getConsole } from '../core/setConsole'
import { MutationOptions } from '../core/types'
import { useQueryClient } from './QueryClientProvider'
import {
  MutateFunction,
  MutationFunction,
  MutationStatus,
  UseMutationResultPair,
} from './types'

// TYPES

type Reducer<S, A> = (prevState: S, action: A) => S

interface State<TData, TError> {
  status: MutationStatus
  data: TData | undefined
  error: TError | null
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
}

interface ResetAction {
  type: 'reset'
}

interface LoadingAction {
  type: 'loading'
}

interface SuccessAction<TData> {
  type: 'success'
  data: TData
}

interface ErrorAction<TError> {
  type: 'error'
  error: TError
}

type Action<TData, TError> =
  | ErrorAction<TError>
  | LoadingAction
  | ResetAction
  | SuccessAction<TData>

// HOOK

function getDefaultState<TData, TError>(): State<TData, TError> {
  return {
    ...getStatusProps('idle'),
    data: undefined,
    error: null,
  }
}

function reducer<TData, TError>(
  state: State<TData, TError>,
  action: Action<TData, TError>
): State<TData, TError> {
  switch (action.type) {
    case 'reset':
      return getDefaultState()
    case 'loading':
      return {
        ...getStatusProps('loading'),
        data: undefined,
        error: null,
      }
    case 'success':
      return {
        ...getStatusProps('success'),
        data: action.data,
        error: null,
      }
    case 'error':
      return {
        ...getStatusProps('error'),
        data: undefined,
        error: action.error,
      }
    default:
      return state
  }
}

export function useMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: MutationFunction<TData, TVariables>,
  options: MutationOptions<TData, TError, TVariables, TContext> = {}
): UseMutationResultPair<TData, TError, TVariables, TContext> {
  const [state, unsafeDispatch] = React.useReducer(
    reducer as Reducer<State<TData, TError>, Action<TData, TError>>,
    null,
    getDefaultState
  )
  const dispatch = useMountedCallback(unsafeDispatch)

  const client = useQueryClient()
  const defaultedOptions = client.defaultMutationOptions(options)
  const latestMutationRef = React.useRef(0)
  const latestMutationFnRef = React.useRef(mutationFn)
  latestMutationFnRef.current = mutationFn
  const latestOptionsRef = React.useRef(defaultedOptions)
  latestOptionsRef.current = defaultedOptions

  const mutate = React.useCallback<
    MutateFunction<TData, TError, TVariables, TContext>
  >(
    async (variables, mutateOptions = {}): Promise<TData | undefined> => {
      dispatch({ type: 'loading' })

      const mutationId = ++latestMutationRef.current
      const latestOptions = latestOptionsRef.current
      const latestMutationFn = latestMutationFnRef.current
      const isLatest = () => latestMutationRef.current === mutationId
      let context: TContext | undefined

      try {
        context = await latestOptions.onMutate?.(variables)
        const data = await latestMutationFn(variables)

        await latestOptions.onSuccess?.(data, variables, context)
        await mutateOptions.onSuccess?.(data, variables, context)
        await latestOptions.onSettled?.(data, null, variables, context)
        await mutateOptions.onSettled?.(data, null, variables, context)

        // Dispatch after handlers as the mutation could still fail
        if (isLatest()) {
          dispatch({ type: 'success', data })
        }

        return data
      } catch (error) {
        getConsole().error(error)
        await latestOptions.onError?.(error, variables, context)
        await mutateOptions.onError?.(error, variables, context)
        await latestOptions.onSettled?.(undefined, error, variables, context)
        await mutateOptions.onSettled?.(undefined, error, variables, context)

        if (isLatest()) {
          dispatch({ type: 'error', error })
        }

        if (mutateOptions.throwOnError || latestOptions.throwOnError) {
          throw error
        }
      }
    },
    [dispatch]
  )

  React.useEffect(() => {
    const latestOptions = latestOptionsRef.current
    if (
      state.error &&
      (latestOptions.useErrorBoundary || latestOptions.suspense)
    ) {
      throw state.error
    }
  }, [state.error])

  const reset = React.useCallback(() => {
    dispatch({ type: 'reset' })
  }, [dispatch])

  return React.useMemo(() => [mutate, { ...state, reset }], [
    mutate,
    state,
    reset,
  ])
}
