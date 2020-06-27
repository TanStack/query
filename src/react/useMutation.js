import React from 'react'

//

import { useConfigContext } from './ReactQueryConfigProvider'
import { useGetLatest, useMountedCallback } from './utils'
import {
  statusIdle,
  statusLoading,
  statusSuccess,
  statusError,
  Console,
  uid,
  noop,
} from '../core/utils'

const getDefaultState = () => ({
  status: statusIdle,
  data: undefined,
  error: null,
})

const actionReset = {}
const actionLoading = {}
const actionResolve = {}
const actionReject = {}

function mutationReducer(state, action) {
  if (action.type === actionReset) {
    return getDefaultState()
  }
  if (action.type === actionLoading) {
    return {
      status: statusLoading,
    }
  }
  if (action.type === actionResolve) {
    return {
      status: statusSuccess,
      data: action.data,
    }
  }
  if (action.type === actionReject) {
    return {
      status: statusError,
      error: action.error,
    }
  }
  throw new Error()
}

export function useMutation(mutationFn, config = {}) {
  const [state, unsafeDispatch] = React.useReducer(
    mutationReducer,
    null,
    getDefaultState
  )

  const dispatch = useMountedCallback(unsafeDispatch)

  const getMutationFn = useGetLatest(mutationFn)

  const getConfig = useGetLatest({
    ...useConfigContext().shared,
    ...useConfigContext().mutations,
    ...config,
  })

  const latestMutationRef = React.useRef()

  const mutate = React.useCallback(
    async (
      variables,
      { onSuccess = noop, onError = noop, onSettled = noop, throwOnError } = {}
    ) => {
      const config = getConfig()

      const mutationId = uid()
      latestMutationRef.current = mutationId

      const isLatest = () => latestMutationRef.current === mutationId

      let snapshotValue

      try {
        dispatch({ type: actionLoading })
        snapshotValue = await config.onMutate(variables)

        let data = await getMutationFn()(variables)

        if (isLatest()) {
          dispatch({ type: actionResolve, data })
        }

        await config.onSuccess(data, variables)
        await onSuccess(data, variables)
        await config.onSettled(data, null, variables)
        await onSettled(data, null, variables)

        return data
      } catch (error) {
        Console.error(error)
        await config.onError(error, variables, snapshotValue)
        await onError(error, variables, snapshotValue)
        await config.onSettled(undefined, error, variables, snapshotValue)
        await onSettled(undefined, error, variables, snapshotValue)

        if (isLatest()) {
          dispatch({ type: actionReject, error })
        }

        if (throwOnError ?? config.throwOnError) {
          throw error
        }
      }
    },
    [dispatch, getConfig, getMutationFn]
  )

  const reset = React.useCallback(() => dispatch({ type: actionReset }), [
    dispatch,
  ])

  React.useEffect(() => {
    const { suspense, useErrorBoundary } = getConfig()

    if ((useErrorBoundary ?? suspense) && state.error) {
      throw state.error
    }
  }, [getConfig, state.error])

  return [
    mutate,
    {
      ...state,
      reset,
      isIdle: state.status === statusIdle,
      isLoading: state.status === statusLoading,
      isSuccess: state.status === statusSuccess,
      isError: state.status === statusError,
    },
  ]
}
