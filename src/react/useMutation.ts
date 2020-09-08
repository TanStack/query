import React from 'react'

import { useMountedCallback } from './utils'
import { getResolvedMutationConfig } from '../core/config'
import { Console, uid, getStatusProps } from '../core/utils'
import {
  QueryStatus,
  MutationResultPair,
  MutationFunction,
  MutationConfig,
  MutateConfig,
  MutationResult,
} from '../core/types'
import { useQueryCache } from './ReactQueryCacheProvider'
import { useContextConfig } from './ReactQueryConfigProvider'

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

const enum ActionType {
  Reset,
  Loading,
  Resolve,
  Reject,
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

function getDefaultState<TResult, TError>(): State<TResult, TError> {
  return {
    ...getStatusProps(QueryStatus.Idle),
    data: undefined,
    error: null,
  }
}

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
  const cache = useQueryCache()
  const contextConfig = useContextConfig()

  // Get resolved config
  const resolvedConfig = getResolvedMutationConfig(cache, contextConfig, config)

  const [state, unsafeDispatch] = React.useReducer(
    mutationReducer as Reducer<State<TResult, TError>, Action<TResult, TError>>,
    null,
    getDefaultState
  )
  const dispatch = useMountedCallback(unsafeDispatch)

  const latestMutationRef = React.useRef<number>()
  const latestMutationFnRef = React.useRef(mutationFn)
  latestMutationFnRef.current = mutationFn
  const latestConfigRef = React.useRef(resolvedConfig)
  latestConfigRef.current = resolvedConfig

  const mutate = React.useCallback(
    async (
      variables?: TVariables,
      mutateConfig: MutateConfig<TResult, TError, TVariables, TSnapshot> = {}
    ): Promise<TResult | undefined> => {
      const latestConfig = latestConfigRef.current

      const mutationId = uid()
      latestMutationRef.current = mutationId

      const isLatest = () => latestMutationRef.current === mutationId

      let snapshotValue: TSnapshot | undefined

      try {
        dispatch({ type: ActionType.Loading })
        snapshotValue = (await latestConfig.onMutate?.(variables!)) as TSnapshot

        const latestMutationFn = latestMutationFnRef.current
        const data = await latestMutationFn(variables!)

        if (isLatest()) {
          dispatch({ type: ActionType.Resolve, data })
        }

        await latestConfig.onSuccess?.(data, variables!)
        await mutateConfig.onSuccess?.(data, variables!)
        await latestConfig.onSettled?.(data, null, variables!)
        await mutateConfig.onSettled?.(data, null, variables!)

        return data
      } catch (error) {
        Console.error(error)
        await latestConfig.onError?.(error, variables!, snapshotValue!)
        await mutateConfig.onError?.(error, variables!, snapshotValue!)
        await latestConfig.onSettled?.(
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

        if (mutateConfig.throwOnError || latestConfig.throwOnError) {
          throw error
        }
      }
    },
    [dispatch]
  )

  React.useEffect(() => {
    const latestConfig = latestConfigRef.current
    const { suspense, useErrorBoundary } = latestConfig
    if ((useErrorBoundary || suspense) && state.error) {
      throw state.error
    }
  }, [state.error])

  const reset = React.useCallback(() => {
    dispatch({ type: ActionType.Reset })
  }, [dispatch])

  const result: MutationResult<TResult, TError> = {
    ...state,
    reset,
  }

  return [mutate, result]
}
