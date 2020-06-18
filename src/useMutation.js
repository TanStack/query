import React from 'react'

//

import { useConfigContext } from './config'
import {
  statusIdle,
  statusLoading,
  statusSuccess,
  statusError,
  useGetLatest,
  Console,
  uid,
  useMountedCallback,
  noop,
} from './utils'

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

      dispatch({ type: actionLoading })

      let snapshotValue

      try {
        snapshotValue = await config.onMutate(variables)

        let data

        if (isLatest()) {
          data = await getMutationFn()(variables)
        }

        if (isLatest()) {
          dispatch({ type: actionResolve, data })
        }

        if (isLatest()) {
          await config.onSuccess(data, variables)
        }

        if (isLatest()) {
          await onSuccess(data, variables)
        }

        if (isLatest()) {
          await config.onSettled(data, null, variables)
        }

        if (isLatest()) {
          await onSettled(data, null, variables)
        }

        return data
      } catch (error) {
        if (isLatest()) {
          Console.error(error)
          await config.onError(error, variables, snapshotValue)
        }

        if (isLatest()) {
          await onError(error, variables, snapshotValue)
        }

        if (isLatest()) {
          await config.onSettled(undefined, error, variables, snapshotValue)
        }

        if (isLatest()) {
          await onSettled(undefined, error, variables, snapshotValue)
        }

        if (isLatest()) {
          dispatch({ type: actionReject, error })

          if (throwOnError ?? config.throwOnError) {
            throw error
          }
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
