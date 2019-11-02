import React from 'react'

const context = React.createContext()
const cancelledError = {}
let globalContextValue = null
let uid = 0

const defaultConfig = {
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  cacheTime: 10 * 1000,
  inactiveCacheTime: 10 * 1000,
  queryAutoRefetch: false,
  refetchAllOnWindowFocus: true,
}

// Focus revalidate
let eventsBinded = false
if (typeof window !== 'undefined' && !eventsBinded) {
  const revalidate = () => {
    const [, , , { refetchAllOnWindowFocus }] = globalContextValue
    if (refetchAllOnWindowFocus && isDocumentVisible() && isOnline())
      refetchAllQueries()
  }
  window.addEventListener('visibilitychange', revalidate, false)
  window.addEventListener('focus', revalidate, false)
  eventsBinded = true
}

export function ReactQueryProvider({ children, config = {} }) {
  const metaRef = React.useRef({})

  const [state, setState] = React.useState({})

  globalContextValue = React.useMemo(() => [state, setState, metaRef], [state])

  globalContextValue[3] = {
    ...defaultConfig,
    ...config,
  }

  return (
    <context.Provider value={globalContextValue}>{children}</context.Provider>
  )
}

export function _useQueryContext() {
  return React.useContext(context)
}

function useSharedQuery(
  userQueryKey,
  { queryFn, instanceId, refetchRef, queryConfig, manual }
) {
  const [
    providerState,
    setProviderState,
    providerMetaRef,
    config,
  ] = React.useContext(context)

  // Create the final query hash
  const [queryHash, queryGroup, variablesHash, variables] = getQueryInfo(
    userQueryKey
  )

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

  const queryState = providerState[queryHash] || defaultQueryState

  const latestRef = React.useRef({})
  latestRef.current = {
    ...queryState,
    queryFn,
    config: merge(queryConfig, config),
  }

  const setQueryState = React.useCallback(
    updater => {
      return setProviderState(old => {
        if (!queryHash) {
          return old
        }

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
    queryHash,
    queryGroup,
    variables,
    variablesHash,
    promise: null,
    previousDelay: 0,
    instancesById: {},
  }

  const sharedMeta = providerMetaRef.current[queryHash]

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
  }, [
    providerMetaRef,
    queryHash,
    setQueryState,
    sharedMeta.cacheTimeout,
    sharedMeta.inactiveCacheTimeout,
  ])

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
  const tryFetchQuery = (tryFetchQueryInstance = React.useCallback(async () => {
    try {
      // Perform the query
      const data = await latestRef.current.queryFn(sharedMeta.variables)

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
        // Only retry if the document is visible
        latestRef.current.config.retry === true ||
        latestRef.current.failureCount < latestRef.current.config.retry
      ) {
        if (!isDocumentVisible()) {
          return new Promise(r => {})
        }

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
              const data = await tryFetchQueryInstance()

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
  }, [
    setQueryState,
    sharedMeta.cancelled,
    sharedMeta.variables,
    tryFetchQueryInstance,
  ]))

  const fetchQuery = React.useCallback(
    async ({ merge }) => {
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
            const data = await tryFetchQuery()

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

  const setData = React.useCallback(
    updater =>
      setQueryState(old => ({
        ...old,
        data: typeof updater === 'function' ? updater(old.data) : updater,
      })),
    [setQueryState]
  )

  // Manage query active-ness and garbage collection
  React.useEffect(() => {
    if (sharedMeta.inactiveCacheTimeout) {
      setQueryState(({ isInactive, ...old }) => {
        return old
      })
      clearTimeout(sharedMeta.inactiveCacheTimeout)
      delete sharedMeta.inactiveCacheTimeout
    }

    sharedMeta.instancesById[instanceId] = {
      refetchRef,
      manual,
    }

    return () => {
      // Do some cleanup between hash changes
      delete sharedMeta.instancesById[instanceId]

      if (!Object.keys(sharedMeta.instancesById).length) {
        sharedMeta.cancelled = cancelledError
        scheduleCacheInvalidation({ cleanup: true })
      }
    }
  }, [
    instanceId,
    manual,
    refetchRef,
    scheduleCacheInvalidation,
    setQueryState,
    sharedMeta,
  ])

  return {
    ...queryState,
    setData,
    fetchQuery,
    queryHash,
    queryGroup,
    variablesHash,
    variables,
    config,
  }
}

export function useQuery(
  userQueryKey,
  queryFn,
  {
    manual = false,
    cache = true,
    cacheTime,
    autoRefetch,
    retry,
    retryDelay,
  } = {}
) {
  const instanceIdRef = React.useRef(uid++)
  const instanceId = instanceIdRef.current

  const refetchRef = React.useRef()

  let queryConfig = {
    retry,
    retryDelay,
    cacheTime,
    autoRefetch,
  }

  const {
    queryHash,
    data,
    error,
    isFetching,
    isCached,
    isStale,
    failureCount,
    fetchQuery,
    setData,
    config,
  } = useSharedQuery(userQueryKey, {
    queryFn,
    cache,
    instanceId,
    refetchRef,
    manual,
    queryConfig,
  })

  queryConfig = merge(queryConfig, config)

  const [isLoading, setIsLoading] = React.useState(
    !queryHash || manual ? false : cache && isCached ? false : true
  )

  const latestRef = React.useRef()
  latestRef.current = {
    queryHash,
    isCached,
    isStale,
    queryConfig,
  }

  React.useEffect(() => {
    if (isCached) {
      setIsLoading(false)
    }
  }, [isCached])

  const refetch = React.useCallback(
    async ({ merge } = {}) => {
      const thisQueryHash = latestRef.current.queryHash

      try {
        if (!latestRef.current.isCached) {
          setIsLoading(true)
        }
        return await fetchQuery({ merge })
      } catch (error) {
        if (thisQueryHash === latestRef.current.queryHash) {
          throw error
        }
      } finally {
        if (thisQueryHash === latestRef.current.queryHash) {
          setIsLoading(false)
        }
      }
    },
    [fetchQuery]
  )

  refetchRef.current = refetch

  React.useEffect(() => {
    if (!queryHash || manual || !latestRef.current.isStale) {
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

  React.useEffect(() => {
    if (isStale && latestRef.current.queryConfig.autoRefetch) {
      refetchRef.current()
    }
  }, [isStale])

  return {
    data,
    error,
    isFetching,
    isCached,
    failureCount,
    isLoading,
    refetch,
    setData,
  }
}

export async function refetchQuery(userQueryKey) {
  const [, queryGroup, variablesHash, variables] = getQueryInfo(userQueryKey)

  if (!queryGroup) {
    return
  }

  const [, , metaRef] = globalContextValue

  const queryPromises = Object.keys(metaRef.current).map(async key => {
    const query = metaRef.current[key]

    if (query.queryGroup !== queryGroup) {
      return
    }

    if (variables === false && query.variablesHash) {
      return
    }

    if (variablesHash && query.variablesHash !== variablesHash) {
      return
    }

    const queryInstancesPromises = Object.keys(query.instancesById).map(
      async id => {
        try {
          await query.instancesById[id].refetchRef.current()
        } catch (err) {
          console.error(err)
        }
      }
    )

    await Promise.all(queryInstancesPromises)
  })

  await Promise.all(queryPromises)
}

export function useMutation(mutationFn) {
  const [data, setData] = React.useState(null)
  const [error, setError] = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const mutationFnRef = React.useRef()
  mutationFnRef.current = mutationFn

  const mutate = React.useCallback(
    async (
      variables,
      {
        throwOnError = false,
        refetchQueries,
        mutateQuery: userMutateQuery,
        waitForRefetchQueries = false,
      } = {}
    ) => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await mutationFnRef.current(variables)
        setData(res)

        if (refetchQueries) {
          const refetchPromises = refetchQueries.map(queryKey =>
            refetchQuery(queryKey)
          )
          if (waitForRefetchQueries) {
            await Promise.all(refetchPromises)
          }
        }

        if (userMutateQuery) {
          mutateQuery(userMutateQuery)
        }

        return res
      } catch (error) {
        setError(error)
        if (throwOnError) {
          throw error
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return [mutate, { data, isLoading, error }]
}

export function useIsFetching() {
  const [state] = React.useContext(context)
  return React.useMemo(() => {
    return Object.keys(state).some(key => state[key].isFetching)
  }, [state])
}

export function mutateQuery(
  userQueryKey,
  updater,
  { shouldRefetch = true } = {}
) {
  const [, setState] = globalContextValue

  const [queryHash, queryGroup] = getQueryInfo(userQueryKey)

  if (!queryGroup) {
    return
  }

  setState(old => ({
    ...old,
    [queryHash]: {
      ...old[queryHash],
      data:
        typeof updater === 'function' ? updater(old[queryHash].data) : updater,
    },
  }))

  if (shouldRefetch) {
    return refetchQuery(userQueryKey)
  }
}

export async function refetchAllQueries({ force } = {}) {
  const [state, , metaRef] = globalContextValue

  const promises = Object.keys(metaRef.current).map(key => {
    const queryState = state[metaRef.current[key].queryHash]
    if (force || (queryState && queryState.isStale)) {
      const promises = Object.keys(metaRef.current[key].instancesById).map(
        key2 => metaRef.current[key].instancesById[key2].refetchRef.current()
      )
      return Promise.all(promises)
    }
    return Promise.resolve()
  })

  await Promise.all(promises)
}

function getQueryInfo(queryKey) {
  if (!queryKey) {
    return []
  }

  if (typeof queryKey === 'function') {
    try {
      return getQueryInfo(queryKey())
    } catch {
      return []
    }
  }

  if (Array.isArray(queryKey)) {
    let [id, variables] = queryKey
    const variablesIsObject = isObject(variables)

    if (process.env.NODE_ENV !== 'production') {
      if (typeof id !== 'string' || (variables && !variablesIsObject)) {
        console.warn('Tuple queryKey:', queryKey)
        throw new Error(
          `Tuple query keys must be of type [string, object]. You have passed [${typeof id}, and ${typeof variables}]`
        )
      }
    }

    const variablesHash = variablesIsObject ? sortedStringify(variables) : ''

    return [
      `${id}${variablesHash ? `_${variablesHash}}` : ''}`,
      id,
      variablesHash,
      variables,
    ]
  }

  return [queryKey, queryKey]
}

function sortedStringifyReplacer(_, value) {
  return isObject(value)
    ? Object.assign(
        {},
        ...Object.keys(value)
          .sort((keyA, keyB) => (keyA > keyB ? 1 : keyB > keyA ? -1 : 0))
          .map(key => ({
            [key]: value[key],
          }))
      )
    : value
}

function sortedStringify(obj) {
  return JSON.stringify(obj, sortedStringifyReplacer)
}

function isObject(a) {
  return a && a !== null && typeof a === 'object'
}

function isDocumentVisible() {
  if (typeof document.visibilityState !== 'undefined') {
    return (
      document.visibilityState === 'visible' ||
      document.visibilityState === 'prerender'
    )
  }
  // always assume it's visible
  return true
}

function isOnline() {
  if (typeof navigator.onLine !== 'undefined') {
    return navigator.onLine
  }
  // always assume it's online
  return true
}

function merge(left, right) {
  const merged = {}

  Object.keys({
    ...left,
    ...right,
  }).forEach(key => {
    merged[key] = firstUndefined(left[key], right[key])
  })

  return merged
}

function firstUndefined(...args) {
  return (
    args.find(d => typeof d !== 'undefined') ||
    args[args.length - 1] ||
    undefined
  )
}
