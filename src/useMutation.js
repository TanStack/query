import React from 'react'

//

import {
  useConfigContext,
  statusLoading,
  statusSuccess,
  statusError,
  Console,
} from './utils'

import { refetchQuery } from './refetchQuery'
import { setQueryData } from './setQueryData'

export function useMutation(
  mutationFn,
  { refetchQueries, refetchQueriesOnFailure, ...config } = {}
) {
  const [data, setData] = React.useState(null)
  const [error, setError] = React.useState(null)
  const [status, setStatus] = React.useState('idle')
  const mutationFnRef = React.useRef()
  mutationFnRef.current = mutationFn

  const { throwOnError, useErrorBoundary } = {
    ...useConfigContext(),
    ...config,
  }

  const mutate = React.useCallback(
    async (variables, { updateQuery, waitForRefetchQueries = false } = {}) => {
      setStatus(statusLoading)
      setError(null)

      const doRefetchQueries = async () => {
        const refetchPromises = refetchQueries.map(queryKey =>
          refetchQuery(queryKey, { force: true })
        )
        if (waitForRefetchQueries) {
          await Promise.all(refetchPromises)
        }
      }

      try {
        const res = await mutationFnRef.current(variables)
        setData(res)

        if (updateQuery) {
          setQueryData(updateQuery, res, { shouldRefetch: false })
        }

        if (refetchQueries) {
          try {
            await doRefetchQueries()
          } catch (err) {
            Console.error(err)
            // Swallow this error since it is a side-effect
          }
        }

        setStatus(statusSuccess)

        return res
      } catch (error) {
        setError(error)

        if (refetchQueriesOnFailure) {
          await doRefetchQueries()
        }

        setStatus(statusError)
        if (throwOnError) {
          throw error
        }
      }
    },
    [refetchQueries, refetchQueriesOnFailure, throwOnError]
  )

  const reset = React.useCallback(() => setData(null), [])

  React.useEffect(() => {
    if (useErrorBoundary && error) {
      throw error
    }
  }, [error, useErrorBoundary])

  return [mutate, { data, status, error, reset }]
}
