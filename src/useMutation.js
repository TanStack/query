import React from 'react'

//

import { useConfigContext } from './config'
import {
  statusIdle,
  statusLoading,
  statusSuccess,
  statusError,
  useGetLatest,
} from './utils'

const getDefaultState = () => ({
  status: statusIdle,
  data: undefined,
  error: null,
})

const actionReset = {}
const actionMutate = {}
const actionResolve = {}
const actionReject = {}

function mutationReducer(state, action) {
  if (action.type === actionReset) {
    return getDefaultState()
  } else if (
    [statusIdle, statusSuccess, statusError].includes(state.status) &&
    action.type === actionMutate
  ) {
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
      data: action.error,
    }
  } else {
    throw new Error()
  }
}

export function useMutation(
  mutationFn,
  { refetchQueries, refetchQueriesOnFailure, ...config } = {}
) {
  const [state, dispatch] = React.useReducer(
    mutationReducer,
    null,
    getDefaultState
  )

  const getMutationFn = useGetLatest(mutationFn)

  const getConfig = useGetLatest({
    ...useConfigContext(),
    ...config,
  })

  const mutate = React.useCallback(
    async (variables, options = {}) => {
      dispatch({ type: actionMutate })

      const resolvedOptions = {
        ...getConfig(),
        ...options,
      }

      try {
        const data = await getMutationFn()(variables)
        dispatch({ type: actionResolve, data })
        await resolvedOptions.onSuccess(data)
        await resolvedOptions.onSettled(data, null)

        return data
      } catch (error) {
        dispatch({ type: actionReject, error })
        await resolvedOptions.onError(error)
        await resolvedOptions.onSettled(undefined, error)

        if (resolvedOptions.throwOnError) {
          throw error
        }
      }
    },
    [getConfig, getMutationFn]
  )

  const reset = React.useCallback(() => dispatch({ type: actionReset }), [])

  React.useEffect(() => {
    if (getConfig().useErrorBoundary && state.error) {
      throw state.error
    }
  }, [getConfig, state.error])

  return [mutate, { ...state, reset }]
}
