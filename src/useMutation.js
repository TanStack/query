import React from 'react'

//

import { useConfigContext } from './config'
import { refetchQuery } from './refetchQuery'
import { setQueryData } from './setQueryData'
import {
  statusIdle,
  statusLoading,
  statusSuccess,
  statusError,
  Console,
  useGetLatest,
  noop,
} from './utils'

const getDefaultState = () => ({
  status: 'idle',
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

  const { throwOnError, useErrorBoundary } = {
    ...useConfigContext(),
    ...config,
  }

  const mutate = React.useCallback(
    async (variables, { updateQuery, waitForRefetchQueries = false } = {}) => {
      dispatch({ type: actionMutate })

      const doRefetchQueries = async () => {
        const refetchPromises = refetchQueries.map(queryKey =>
          refetchQuery(queryKey, { force: true })
        )
        if (waitForRefetchQueries) {
          await Promise.all(refetchPromises)
        }
      }

      try {
        const data = await getMutationFn()(variables)

        if (updateQuery) {
          setQueryData(updateQuery, data, { shouldRefetch: false })
        }

        if (refetchQueries) {
          try {
            await doRefetchQueries()
          } catch (err) {
            Console.error(err)
            // Swallow this error since it is a side-effect
          }
        }

        dispatch({ type: actionResolve, data })

        return data
      } catch (error) {
        dispatch({ type: actionReject, error })

        if (refetchQueriesOnFailure) {
          doRefetchQueries().catch(noop)
        }

        if (throwOnError) {
          throw error
        }
      }
    },
    [getMutationFn, refetchQueries, refetchQueriesOnFailure, throwOnError]
  )

  const reset = React.useCallback(() => dispatch({ action: actionReset }), [])

  React.useEffect(() => {
    if (useErrorBoundary && state.error) {
      throw state.error
    }
  }, [state.error, useErrorBoundary])

  return [mutate, { ...state, reset }]
}
