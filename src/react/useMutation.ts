import React from 'react'

import { useIsMounted } from './utils'
import { getStatusProps, noop } from '../core/utils'
import { getLogger } from '../core/logger'
import { notifyManager } from '../core/notifyManager'
import { useQueryClient } from './QueryClientProvider'
import {
  MutateAsyncFunction,
  MutateFunction,
  MutationFunction,
  MutationStatus,
  UseMutationOptions,
  UseMutationResult,
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
  options: UseMutationOptions<TData, TError, TVariables, TContext> = {}
): UseMutationResult<TData, TError, TVariables, TContext> {
  const isMounted = useIsMounted()
  const [state, dispatch] = React.useReducer(
    reducer as Reducer<State<TData, TError>, Action<TData, TError>>,
    null,
    getDefaultState
  )

  const safeDispatch = React.useCallback<typeof dispatch>(
    value => {
      notifyManager.schedule(() => {
        if (isMounted()) {
          dispatch(value)
        }
      })
    },
    [dispatch, isMounted]
  )

  const client = useQueryClient()
  const defaultedOptions = client.defaultMutationOptions(options)
  const latestMutationIdRef = React.useRef(0)
  const latestMutationFnRef = React.useRef(mutationFn)
  latestMutationFnRef.current = mutationFn
  const latestOptionsRef = React.useRef(defaultedOptions)
  latestOptionsRef.current = defaultedOptions

  const mutateAsync = React.useCallback<
    MutateAsyncFunction<TData, TError, TVariables, TContext>
  >(
    async (variables, mutateOptions = {}): Promise<TData> => {
      safeDispatch({ type: 'loading' })

      const mutationId = ++latestMutationIdRef.current
      const latestOptions = latestOptionsRef.current
      const latestMutationFn = latestMutationFnRef.current
      let context: TContext | undefined

      try {
        context = await latestOptions.onMutate?.(variables)
        const data = await latestMutationFn(variables)

        await latestOptions.onSuccess?.(data, variables, context)
        await mutateOptions.onSuccess?.(data, variables, context)
        await latestOptions.onSettled?.(data, null, variables, context)
        await mutateOptions.onSettled?.(data, null, variables, context)

        // Dispatch after handlers as the mutation could still fail
        if (latestMutationIdRef.current === mutationId) {
          safeDispatch({ type: 'success', data })
        }

        return data
      } catch (error) {
        getLogger().error(error)
        await latestOptions.onError?.(error, variables, context)
        await mutateOptions.onError?.(error, variables, context)
        await latestOptions.onSettled?.(undefined, error, variables, context)
        await mutateOptions.onSettled?.(undefined, error, variables, context)

        if (latestMutationIdRef.current === mutationId) {
          safeDispatch({ type: 'error', error })
        }

        throw error
      }
    },
    [safeDispatch]
  )

  const mutate = React.useCallback<
    MutateFunction<TData, TError, TVariables, TContext>
  >(
    (variables, mutateOptions) => {
      mutateAsync(variables, mutateOptions).catch(noop)
    },
    [mutateAsync]
  )

  const reset = React.useCallback(() => {
    safeDispatch({ type: 'reset' })
  }, [safeDispatch])

  React.useEffect(() => {
    const latestOptions = latestOptionsRef.current
    if (
      state.error &&
      (latestOptions.useErrorBoundary || latestOptions.suspense)
    ) {
      throw state.error
    }
  }, [state.error])

  return { ...state, mutate, mutateAsync, reset }
}
