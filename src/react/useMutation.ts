import React from 'react'

import { useMountedCallback } from './utils'
import { getStatusProps } from '../core/utils'
import { getConsole } from '../core/setConsole'
import { MutateOptions, MutationOptions } from '../core/types'
import { useQueryClient } from './QueryClientProvider'
import {
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

interface ResolveAction<TData> {
  type: 'resolve'
  data: TData
}

interface RejectAction<TError> {
  type: 'reject'
  error: TError
}

type Action<TData, TError> =
  | ResetAction
  | LoadingAction
  | ResolveAction<TData>
  | RejectAction<TError>

// HOOK

let _uid = 0

function uid(): number {
  return _uid++
}

function getDefaultState<TData, TError>(): State<TData, TError> {
  return {
    ...getStatusProps('idle'),
    data: undefined,
    error: null,
  }
}

function mutationReducer<TData, TError>(
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
    case 'resolve':
      return {
        ...getStatusProps('success'),
        data: action.data,
        error: null,
      }
    case 'reject':
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
  TData,
  TError = unknown,
  TVariables = undefined,
  TSnapshot = unknown
>(
  mutationFn: MutationFunction<TData, TVariables>,
  options: MutationOptions<TData, TError, TVariables, TSnapshot> = {}
): UseMutationResultPair<TData, TError, TVariables, TSnapshot> {
  const client = useQueryClient()

  // Get defaulted options
  const defaultedOptions = client.defaultMutationOptions(options)

  const [state, unsafeDispatch] = React.useReducer(
    mutationReducer as Reducer<State<TData, TError>, Action<TData, TError>>,
    null,
    getDefaultState
  )

  const dispatch = useMountedCallback(unsafeDispatch)

  const latestMutationRef = React.useRef<number>()
  const latestMutationFnRef = React.useRef(mutationFn)
  latestMutationFnRef.current = mutationFn
  const latestOptionsRef = React.useRef(defaultedOptions)
  latestOptionsRef.current = defaultedOptions

  const mutate = React.useCallback(
    async (
      variables: TVariables,
      mutateOptions: MutateOptions<TData, TError, TVariables, TSnapshot> = {}
    ): Promise<TData | undefined> => {
      const latestOptions = latestOptionsRef.current

      const mutationId = uid()
      latestMutationRef.current = mutationId

      const isLatest = () => latestMutationRef.current === mutationId

      let snapshotValue: TSnapshot | undefined

      try {
        dispatch({ type: 'loading' })
        snapshotValue = await latestOptions.onMutate?.(variables)

        const latestMutationFn = latestMutationFnRef.current
        const data = await latestMutationFn(variables)

        if (isLatest()) {
          dispatch({ type: 'resolve', data })
        }

        await latestOptions.onSuccess?.(data, variables)
        await mutateOptions.onSuccess?.(data, variables)
        await latestOptions.onSettled?.(data, null, variables)
        await mutateOptions.onSettled?.(data, null, variables)

        return data
      } catch (error) {
        getConsole().error(error)
        await latestOptions.onError?.(error, variables, snapshotValue)
        await mutateOptions.onError?.(error, variables, snapshotValue)
        await latestOptions.onSettled?.(
          undefined,
          error,
          variables,
          snapshotValue
        )
        await mutateOptions.onSettled?.(
          undefined,
          error,
          variables,
          snapshotValue
        )

        if (isLatest()) {
          dispatch({ type: 'reject', error })
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
    const { suspense, useErrorBoundary } = latestOptions
    if ((useErrorBoundary || suspense) && state.error) {
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
