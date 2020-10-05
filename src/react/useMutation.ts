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
    action => {
      notifyManager.schedule(() => {
        if (isMounted()) {
          dispatch(action)
        }
      })
    },
    [dispatch, isMounted]
  )

  const client = useQueryClient()
  const defaultedOptions = client.defaultMutationOptions(options)
  const lastMutationIdRef = React.useRef(0)
  const lastMutationFnRef = React.useRef(mutationFn)
  lastMutationFnRef.current = mutationFn
  const lastOptionsRef = React.useRef(defaultedOptions)
  lastOptionsRef.current = defaultedOptions

  const mutateAsync = React.useCallback<
    MutateAsyncFunction<TData, TError, TVariables, TContext>
  >(
    (vars, mutateOpts = {}): Promise<TData> => {
      const mutationId = ++lastMutationIdRef.current
      const mutationOpts = lastOptionsRef.current
      const lastMutationFn = lastMutationFnRef.current

      let ctx: TContext | undefined
      let data: TData

      safeDispatch({ type: 'loading' })

      return Promise.resolve()
        .then(() => mutationOpts.onMutate?.(vars))
        .then(context => {
          ctx = context
        })
        .then(() => lastMutationFn(vars))
        .then(result => {
          data = result
        })
        .then(() => mutationOpts.onSuccess?.(data, vars, ctx))
        .then(() => mutationOpts.onSettled?.(data, null, vars, ctx))
        .then(() => mutateOpts.onSuccess?.(data, vars, ctx))
        .then(() => mutateOpts.onSettled?.(data, null, vars, ctx))
        .then(() => {
          if (lastMutationIdRef.current === mutationId) {
            safeDispatch({ type: 'success', data })
          }
          return data
        })
        .catch(error => {
          getLogger().error(error)
          return Promise.resolve()
            .then(() => mutationOpts.onError?.(error, vars, ctx))
            .then(() => mutationOpts.onSettled?.(undefined, error, vars, ctx))
            .then(() => mutateOpts.onError?.(error, vars, ctx))
            .then(() => mutateOpts.onSettled?.(undefined, error, vars, ctx))
            .then(() => {
              if (lastMutationIdRef.current === mutationId) {
                safeDispatch({ type: 'error', error })
              }
              throw error
            })
        })
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
    const lastOptions = lastOptionsRef.current
    if (state.error && (lastOptions.useErrorBoundary || lastOptions.suspense)) {
      throw state.error
    }
  }, [state.error])

  return { ...state, mutate, mutateAsync, reset }
}
