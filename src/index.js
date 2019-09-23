import React from 'react'

const context = React.createContext()

let uid = 0
const queryIDsByQuery = new Map()

export function ReactQueryProvider({ children, config = {} }) {
  const metaRef = React.useRef({})

  const [state, setState] = React.useState({})

  const contextValue = React.useMemo(() => [state, setState, metaRef], [state])

  contextValue[3] = {
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    cacheTime: 10 * 1000,
    inactiveCacheTime: 10 * 1000,
    ...config,
  }

  return <context.Provider value={contextValue}>{children}</context.Provider>
}

function useVariables(variablesObj) {
  const stringified = sortedStringify(variablesObj)
  // eslint-disable-next-line
  return React.useMemo(() => variablesObj, [stringified])
}

export function _useQueryContext() {
  return React.useContext(context)
}

function useSharedQuery({
  query,
  queryID: customQueryID,
  variables: variablesObj,
  cache,
  instanceID,
  refetchRef,
  retry: queryRetry,
  retryDelay: queryRetryDelay,
  cacheTime: queryCacheTime,
  inactiveCacheTime: queryInactiveCacheTime,
  manual,
}) {
  const [
    providerState,
    setProviderState,
    providerMetaRef,
    config,
  ] = React.useContext(context)

  // Use this cacheBusterRef ID to avoid cache usage
  const cacheBusterRef = React.useRef()
  if (!cacheBusterRef) {
    cacheBusterRef.current = uid++
  }

  // Create the final query hash
  const [queryHash, queryID, variablesHash] = getQueryInfo({
    query,
    queryID: customQueryID,
    variables: variablesObj,
    cacheBuster: !cache ? cacheBusterRef.current : '',
  })

  const variables = useVariables(variablesObj)

  const defaultQueryState = React.useMemo(
    () => ({
      data: null,
      error: null,
      isFetching: false,
      failureCount: 0,
      isCached: false,
      isStale: true,
    }),
    []
  )

  const latestRef = React.useRef({})

  const queryState = providerState[queryHash] || defaultQueryState

  Object.assign(latestRef.current, queryState)

  const setQueryState = React.useCallback(
    updater => {
      return setProviderState(old => {
        const oldQueryState =
          typeof old[queryHash] === 'undefined'
            ? defaultQueryState
            : old[queryHash]

        const newValue =
          typeof updater === 'function' ? updater(oldQueryState) : updater

        if (typeof newValue === 'undefined') {
          const { [queryHash]: _, ...rest } = old
          return rest
        }

        return {
          ...old,
          [queryHash]: newValue,
        }
      })
    },
    [setProviderState, queryHash, defaultQueryState]
  )

  providerMetaRef.current[queryHash] = providerMetaRef.current[queryHash] || {
    queryID,
    variablesHash,
    promise: null,
    previousDelay: 0,
    instancesByID: {},
  }

  const sharedMeta = providerMetaRef.current[queryHash]

  latestRef.current.config = {
    ...config,
    retry: typeof queryRetry !== 'undefined' ? queryRetry : config.retry,
    retryDelay:
      typeof queryRetryDelay !== 'undefined'
        ? queryRetryDelay
        : config.retryDelay,
    cacheTime:
      typeof queryCacheTime !== 'undefined' ? queryCacheTime : config.cacheTime,
    inactiveCacheTime:
      typeof queryInactiveCacheTime !== 'undefined'
        ? queryInactiveCacheTime
        : config.inactiveCacheTime,
  }

  const scheduleCleanup = React.useCallback(() => {
    clearTimeout(sharedMeta.inactiveCacheTimeout)
    setQueryState(old => {
      return {
        ...old,
        isInactive: true,
      }
    })
    sharedMeta.inactiveCacheTimeout = setTimeout(() => {
      setQueryState(undefined)
      clearTimeout(sharedMeta.cacheTimeout)
      delete providerMetaRef.current[queryHash]
    }, latestRef.current.config.inactiveCacheTime)
  }, [providerMetaRef, queryHash, setQueryState, sharedMeta])

  const doInvalidation = React.useCallback(() => {
    setQueryState(old => {
      return {
        ...old,
        isStale: true,
      }
    })
  }, [setQueryState])

  const scheduleCacheInvalidation = React.useCallback(
    ({ cleanup } = {}) => {
      if (cleanup) {
        return scheduleCleanup()
      } else {
        clearTimeout(sharedMeta.cacheTimeout)
      }

      sharedMeta.cacheTimeout = setTimeout(() => {
        // Otherwise, just mark the data as stale
        doInvalidation()
      }, latestRef.current.config.cacheTime)
    },
    [sharedMeta, scheduleCleanup, doInvalidation]
  )

  let tryFetchQueryInstance

  // Set up the fetch function
  const tryFetchQuery = (tryFetchQueryInstance = React.useCallback(
    async ({ variables }) => {
      try {
        // Perform the query
        const data = await query(variables)

        if (sharedMeta.cancelled) throw sharedMeta.cancelled

        return data
      } catch (error) {
        if (sharedMeta.cancelled) throw sharedMeta.cancelled

        // If we fail, increase the failureCount
        setQueryState(old => {
          return {
            ...old,
            failureCount: old.failureCount + 1,
          }
        })

        // Do we need to retry the request?
        if (
          latestRef.current.config.retry === true ||
          latestRef.current.failureCount < latestRef.current.config.retry
        ) {
          // Determine the retryDelay
          const delay =
            typeof latestRef.current.config.retryDelay === 'function'
              ? latestRef.current.config.retryDelay(
                  latestRef.current.failureCount
                )
              : latestRef.current.config.retryDelay

          // Return a new promise with the retry
          return new Promise((resolve, reject) => {
            // Keep track of the retry timeout
            setTimeout(async () => {
              if (sharedMeta.cancelled) return reject(sharedMeta.cancelled)

              try {
                const data = await tryFetchQueryInstance({
                  variables,
                })

                if (sharedMeta.cancelled) return reject(sharedMeta.cancelled)

                resolve(data)
              } catch (error) {
                if (sharedMeta.cancelled) return reject(sharedMeta.cancelled)

                reject(error)
              }
            }, delay)
          })
        }

        throw error
      }
    },
    [query, setQueryState, sharedMeta, tryFetchQueryInstance]
  ))

  const fetchQuery = React.useCallback(
    async ({ variables, merge }) => {
      // Create a new promise for the query cache if necessary
      if (!sharedMeta.promise) {
        sharedMeta.promise = (async () => {
          // If there are any retries pending for this query, kill them
          sharedMeta.cancelled = false

          try {
            // Set up the query refreshing state
            setQueryState(old => {
              return {
                ...old,
                error: null,
                isFetching: true,
                failureCount: 0,
              }
            })

            // Try to fetch
            const data = await tryFetchQuery({ variables })

            // Set data and mark it as cached
            setQueryState(old => {
              return {
                ...old,
                data: merge ? merge(old.data, data) : data,
                isCached: true,
                isStale: false,
              }
            })

            return data
          } catch (error) {
            // As long as it's not a cancelled retry
            if (error !== sharedMeta.cancelled) {
              // Store the error
              setQueryState(old => {
                return {
                  ...old,
                  error,
                  isCached: false,
                  isStale: true,
                }
              })

              throw error
            }
          } finally {
            // Schedule a fresh invalidation, always!
            scheduleCacheInvalidation()

            setQueryState(old => {
              return {
                ...old,
                isFetching: false,
              }
            })
            delete sharedMeta.promise
          }
        })()
      }

      return sharedMeta.promise
    },
    [scheduleCacheInvalidation, setQueryState, sharedMeta, tryFetchQuery]
  )

  // Manage query active-ness and garbage collection
  React.useEffect(() => {
    if (sharedMeta.inactiveCacheTimeout) {
      setQueryState(({ isInactive, ...old }) => {
        return old
      })
      clearTimeout(sharedMeta.inactiveCacheTimeout)
    }

    sharedMeta.instancesByID[instanceID] = {
      refetchRef,
      manual,
    }

    return () => {
      // Do some cleanup between hash changes
      delete sharedMeta.instancesByID[instanceID]

      if (!Object.keys(sharedMeta.instancesByID).length) {
        sharedMeta.cancelled = {}
        scheduleCacheInvalidation({ cleanup: true })
      }
    }
  }, [
    instanceID,
    manual,
    providerMetaRef,
    queryHash,
    refetchRef,
    scheduleCacheInvalidation,
    setQueryState,
    sharedMeta,
  ])

  return {
    ...queryState,
    variables,
    fetchQuery,
    queryHash,
  }
}

export function useQuery(
  query,
  {
    variables: userVariables,
    queryID: customQueryID,
    tags = [],
    manual = false,
    cache = true,
    cacheTime,
    retry: queryRetry,
    retryDelay: queryRetryDelay,
    disableThrow: queryDisableThrow,
  }
) {
  const instanceIDRef = React.useRef(uid++)
  const instanceID = instanceIDRef.current

  const refetchRef = React.useRef()

  const {
    data,
    error,
    isFetching,
    isCached,
    isStale,
    failureCount,
    variables: defaultVariables,
    fetchQuery,
    queryHash,
  } = useSharedQuery({
    query,
    queryID: customQueryID,
    tags,
    variables: userVariables,
    cache,
    instanceID,
    refetchRef,
    retry: queryRetry,
    retryDelay: queryRetryDelay,
    cacheTime,
    manual,
  })

  const [isLoading, setIsLoading] = React.useState(
    manual ? false : cache && isCached ? false : true
  )

  const latestRef = React.useRef()
  latestRef.current = {
    isCached,
    queryDisableThrow,
    isStale,
  }

  const refetch = React.useCallback(
    async ({
      variables = defaultVariables,
      merge,
      disableThrow = latestRef.current.queryDisableThrow,
    } = {}) => {
      if (!latestRef.current.isCached) {
        setIsLoading(true)
      }

      try {
        return await fetchQuery({ variables, merge })
      } catch (error) {
        if (disableThrow) {
          // If throwing is disabled, log the error
          console.error(error)
        } else {
          // Otherwise, rethrow the error
          throw error
        }
      } finally {
        setIsLoading(false)
      }
    },
    [defaultVariables, fetchQuery]
  )

  refetchRef.current = refetch

  React.useEffect(() => {
    if (manual || !latestRef.current.isStale) {
      return
    }

    const runRefetch = async () => {
      try {
        await refetch()
      } catch (err) {
        console.error(err)
        // Swallow this error. Don't rethrow it into a render function
      }
    }

    runRefetch()
  }, [manual, queryHash, refetch])

  return {
    data,
    error,
    isFetching,
    isCached,
    failureCount,
    isLoading,
    refetch,
  }
}

export function useRefetchQueries() {
  const [, , providerMetaRef] = React.useContext(context)

  return React.useCallback(
    async (
      refetchQueries,
      {
        waitForRefetchQueries,
        includeManual: defaultIncludeManual = false,
      } = {}
    ) => {
      const refetchQueryPromises = refetchQueries.map(async refetchQuery => {
        const {
          query,
          queryID: customQueryID,
          variables,
          includeManual = defaultIncludeManual,
        } =
          typeof refetchQuery === 'function'
            ? { query: refetchQuery }
            : typeof refetchQuery === 'string'
            ? { queryID: refetchQuery }
            : refetchQuery

        const [, queryID, variablesHash] = getQueryInfo({
          query,
          queryID: customQueryID,
          variables,
        })

        const matchingQueriesPromises = Object.keys(
          providerMetaRef.current
        ).map(async key => {
          const query = providerMetaRef.current[key]
          if (!query.queryID === queryID) {
            return
          }
          if (variablesHash && query.variablesHash !== variablesHash) {
            return
          }

          const queryInstancesPromises = Object.keys(query.instancesByID).map(
            async id => {
              try {
                if (query.instancesByID[id].manual && !includeManual) {
                  return
                }
                await query.instancesByID[id].refetchRef.current()
              } catch (err) {
                console.error(err)
                // Swallow this error. Don't leak it out into any render functions
              }
            }
          )

          await Promise.all(queryInstancesPromises)
        })

        await Promise.all(matchingQueriesPromises)
      })

      if (waitForRefetchQueries) {
        await Promise.all(refetchQueryPromises)
      }
    },
    [providerMetaRef]
  )
}

export function useUpdateQueries() {
  const [, setState] = React.useContext(context)

  return React.useCallback(
    (updaters, data) => {
      updaters.forEach(updater => {
        const { query, queryID: customQueryID, variables } =
          typeof updater === 'function'
            ? { query: updater }
            : typeof updater === 'string'
            ? { queryID: updater }
            : updater

        const [queryHash] = getQueryInfo({
          query,
          queryID: customQueryID,
          variables:
            typeof variables === 'function' ? variables(data) : variables,
        })

        setState(old => ({
          ...old,
          [queryHash]: {
            ...old[queryHash],
            data,
          },
        }))
      })
    },
    [setState]
  )
}

export function useMutation(
  mutation,
  { refetchQueries: defaultRefetchQueries } = {}
) {
  const [data, setData] = React.useState(null)
  const [error, setError] = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const refetchQueries = useRefetchQueries()
  const updateQueries = useUpdateQueries()

  const mutate = React.useCallback(
    async (
      variables,
      {
        refetchQueries: userRefetchQueries = defaultRefetchQueries,
        updateQueries: userUpdateQueries,
        waitForRefetchQueries,
        disableThrow,
      } = {}
    ) => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await mutation(variables)
        setData(res)
        if (userRefetchQueries) {
          await refetchQueries(userRefetchQueries, {
            waitForRefetchQueries,
          })
        }
        if (userUpdateQueries) {
          updateQueries(userUpdateQueries, res)
        }
        return res
      } catch (error) {
        setError(error)
        if (disableThrow) {
          console.error(error)
        } else {
          throw error
        }
      } finally {
        setIsLoading(false)
      }
    },
    [defaultRefetchQueries, mutation, refetchQueries, updateQueries]
  )

  return [mutate, { data, isLoading, error }]
}

export function useIsFetching() {
  const [state] = React.useContext(context)
  return React.useMemo(() => {
    return Object.keys(state).some(key => state[key].isFetching)
  }, [state])
}

export function useRefetchAll({
  disableThrow: defaultDisableThrow,
  includeManual: defaultIncludeManual,
} = {}) {
  const [, , metaRef] = React.useContext(context)
  return React.useCallback(
    async ({
      disableThrow = defaultDisableThrow,
      includeManual = defaultIncludeManual,
    } = {}) => {
      const promises = Object.keys(metaRef.current).map(key => {
        const promises = Object.keys(metaRef.current[key].instancesByID).map(
          key2 => {
            if (
              metaRef.current[key].instancesByID[key2].manual &&
              !includeManual
            ) {
              return Promise.resolve()
            }
            return metaRef.current[key].instancesByID[key2].refetchRef.current()
          }
        )
        return Promise.all(promises)
      })
      try {
        await Promise.all(promises)
      } catch (err) {
        if (disableThrow) {
          console.error(err)
        } else {
          throw err
        }
      }
    },
    [defaultDisableThrow, defaultIncludeManual, metaRef]
  )
}

// Utils

function getQueryID(query, customQueryID) {
  // Get a query ID for this query function
  let queryID = customQueryID || queryIDsByQuery.get(query)
  // Make the queryID if necessary
  if (!queryID) {
    queryIDsByQuery.set(query, uid++)
    queryID = queryIDsByQuery.get(query)
  }

  return queryID
}

function getQueryInfo({
  query,
  queryID: customQueryID,
  variables: variablesObj,
  cacheBuster = '',
}) {
  const queryID = getQueryID(query, customQueryID)
  const variablesHash = sortedStringify(variablesObj)
  return [
    [queryID, variablesHash, cacheBuster].join(''),
    queryID,
    variablesHash,
  ]
}

function sortedStringifyReplacer(_, value) {
  return value === null || typeof value !== 'object' || Array.isArray(value)
    ? value
    : Object.assign(
        {},
        ...Object.keys(value)
          .sort((keyA, keyB) => (keyA > keyB ? 1 : keyB > keyA ? -1 : 0))
          .map(key => ({
            [key]: value[key],
          }))
      )
}

function sortedStringify(obj) {
  return JSON.stringify(obj, sortedStringifyReplacer)
}
