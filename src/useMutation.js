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
    async (variables, options = {}) => {
      const resolvedOptions = {
        ...getConfig(),
        ...options,
      }

      const mutationId = uid()
      latestMutationRef.current = mutationId

      dispatch({ type: actionLoading })

      try {
        const data = await getMutationFn()(variables)
        await resolvedOptions.onSuccess(data)
        await resolvedOptions.onSettled(data, null)

        if (latestMutationRef.current === mutationId) {
          dispatch({ type: actionResolve, data })
        }

        return data
      } catch (error) {
        Console.error(error)
        await resolvedOptions.onError(error)
        await resolvedOptions.onSettled(undefined, error)

        if (latestMutationRef.current === mutationId) {
          dispatch({ type: actionReject, error })
        }

        if (resolvedOptions.throwOnError) {
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
