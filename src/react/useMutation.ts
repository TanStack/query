import React from 'react'

import { useDefaultedMutationConfig } from './useDefaultedMutationConfig'
import { useGetLatest, useMountedCallback } from './utils'
import { Console, uid, getStatusProps } from '../core/utils'
import {
  QueryStatus,
  MutationResultPair,
  MutationFunction,
  MutationConfig,
  MutateConfig,
} from '../core/types'

// TYPES

type Reducer<S, A> = (prevState: S, action: A) => S

interface State<TResult, TError> {
  status: QueryStatus
  data: TResult | undefined
  error: TError | null
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
}

enum ActionType {
  Reset = 'Reset',
  Loading = 'Loading',
  Resolve = 'Resolve',
  Reject = 'Reject',
}

interface ResetAction {
  type: ActionType.Reset
}

interface LoadingAction {
  type: ActionType.Loading
}

interface ResolveAction<TResult> {
  type: ActionType.Resolve
  data: TResult
}

interface RejectAction<TError> {
  type: ActionType.Reject
  error: TError
}

type Action<TResult, TError> =
  | ResetAction
  | LoadingAction
  | ResolveAction<TResult>
  | RejectAction<TError>

// HOOK

const getDefaultState = (): State<any, any> => ({
  ...getStatusProps(QueryStatus.Idle),
  data: undefined,
  error: null,
})

function mutationReducer<TResult, TError>(
  state: State<TResult, TError>,
  action: Action<TResult, TError>
): State<TResult, TError> {
  switch (action.type) {
    case ActionType.Reset:
      return getDefaultState()
    case ActionType.Loading:
      return {
        ...getStatusProps(QueryStatus.Loading),
        data: undefined,
        error: null,
      }
    case ActionType.Resolve:
      return {
        ...getStatusProps(QueryStatus.Success),
        data: action.data,
        error: null,
      }
    case ActionType.Reject:
      return {
        ...getStatusProps(QueryStatus.Error),
        data: undefined,
        error: action.error,
      }
    default:
      return state
  }
}

export function useMutation<
  TResult,
  TError = unknown,
  TVariables = undefined,
  TSnapshot = unknown
>(
  mutationFn: MutationFunction<TResult, TVariables>,
  config: MutationConfig<TResult, TError, TVariables, TSnapshot> = {}
): MutationResultPair<TResult, TError, TVariables, TSnapshot> {
  config = useDefaultedMutationConfig(config)
  const getConfig = useGetLatest(config)

  const [state, unsafeDispatch] = React.useReducer(
    mutationReducer as Reducer<State<TResult, TError>, Action<TResult, TError>>,
    null,
    getDefaultState
  )

  const dispatch = useMountedCallback(unsafeDispatch)

  const getMutationFn = useGetLatest(mutationFn)

  const latestMutationRef = React.useRef<number>()

  const mutate = React.useCallback(
    async (
      variables?: TVariables,
      mutateConfig: MutateConfig<TResult, TError, TVariables, TSnapshot> = {}
    ): Promise<TResult | undefined> => {
      const config = getConfig()

      const mutationId = uid()
      latestMutationRef.current = mutationId

      const isLatest = () => latestMutationRef.current === mutationId

      let snapshotValue: TSnapshot | undefined

      try {
        dispatch({ type: ActionType.Loading })
        snapshotValue = (await config.onMutate?.(variables!)) as TSnapshot

        const data = await getMutationFn()(variables!)

        if (isLatest()) {
          dispatch({ type: ActionType.Resolve, data })
        }

        await config.onSuccess?.(data, variables!)
        await mutateConfig.onSuccess?.(data, variables!)
        await config.onSettled?.(data, null, variables!)
        await mutateConfig.onSettled?.(data, null, variables!)

        return data
      } catch (error) {
        Console.error(error)
        await config.onError?.(error, variables!, snapshotValue!)
        await mutateConfig.onError?.(error, variables!, snapshotValue!)
        await config.onSettled?.(
          undefined,
          error,
          variables!,
          snapshotValue as TSnapshot
        )
        await mutateConfig.onSettled?.(
          undefined,
          error,
          variables!,
          snapshotValue
        )

        if (isLatest()) {
          dispatch({ type: ActionType.Reject, error })
        }

        if (mutateConfig.throwOnError ?? config.throwOnError) {
          throw error
        }

        return
      }
    },
    [dispatch, getConfig, getMutationFn]
  )

  const reset = React.useCallback(() => {
    dispatch({ type: ActionType.Reset })
  }, [dispatch])

  React.useEffect(() => {
    const { suspense, useErrorBoundary } = getConfig()

    if ((useErrorBoundary ?? suspense) && state.error) {
      throw state.error
    }
  }, [getConfig, state.error])

  return [mutate, { ...state, reset }]
}
