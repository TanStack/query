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
  } else if (action.type === actionLoading) {
    return {
      status: statusLoading,
    }
  } else if (state.status === statusLoading && action.type === actionResolve) {
    return {
      status: statusSuccess,
      data: action.data,
    }
  } else if (state.status === statusLoading && action.type === actionReject) {
    return {
      status: statusError,
      error: action.error,
    }
  } else {
    throw new Error()
  }
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
    ...useConfigContext(),
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

      dispatch({ type: actionLoading })

      try {
        const data = await getMutationFn()(variables)
        await onSuccess(data, variables)
        await config.onSuccess(data, variables)
        await onSettled(data, null, variables)
        await config.onSettled(data, null, variables)

        if (latestMutationRef.current === mutationId) {
          dispatch({ type: actionResolve, data })
        }

        return data
      } catch (error) {
        Console.error(error)
        await onError(error, variables)
        await config.onError(error, variables)
        await onSettled(undefined, error, variables)
        await config.onSettled(undefined, error, variables)

        if (latestMutationRef.current === mutationId) {
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
    if (getConfig().useErrorBoundary && state.error) {
      throw state.error
    }
  }, [getConfig, state.error])

  return [mutate, { ...state, reset }]
}
