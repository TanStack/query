import React from 'react'

let queries = []
const cancelledError = {}
let globalStateListeners = []
let uid = 0

// Focus revalidate
let eventsBinded = false
if (typeof window !== 'undefined' && !eventsBinded) {
  const revalidate = () => {
    const { refetchAllOnWindowFocus } = defaultConfig
    if (refetchAllOnWindowFocus && isDocumentVisible() && isOnline())
      refetchAllQueries()
  }
  window.addEventListener('visibilitychange', revalidate, false)
  window.addEventListener('focus', revalidate, false)
  eventsBinded = true
}

let defaultConfig = {
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 0,
  cacheTime: 5 * 60 * 1000,
  queryAutoRefetch: false,
  refetchAllOnWindowFocus: true,
  autoRefetch: false,
}

export function useReactQueryConfig(config = {}) {
  Object.assign(defaultConfig, config)
}

function makeQuery({
  queryHash,
  queryGroup,
  variablesHash,
  variables,
  config,
  queryFn,
}) {
  let query = {
    queryHash,
    queryGroup,
    variablesHash,
    variables,
    promise: null,
    previousDelay: 0,
    staleTimeout: null,
    cacheTimeout: null,
    cancelled: null,
    state: {
      data: config.paginated ? [] : null,
      error: null,
      isFetching: false,
      isFetchingMore: false,
      canFetchMore: false,
      failureCount: 0,
      isCached: false,
      isStale: true,
    },
    pageVariables: [],
    instances: [],
  }

  query.setState = updater => {
    query.state = typeof updater === 'function' ? updater(query.state) : updater
    query.instances.forEach(instance => {
      instance.onStateUpdate(query.state)
    })
    globalStateListeners.forEach(d => d())
  }

  query.subscribe = instance => {
    let found = query.instances.find(d => d.id === instance.id)

    if (found) {
      Object.assign(found, instance)
    } else {
      found = instance
      query.instances.push(instance)
    }

    // Mark as inactive
    query.setState(old => {
      return {
        ...old,
        isInactive: false,
      }
    })

    // Cancel garbage collection
    clearTimeout(query.cacheTimeout)

    // Mark the query as not cancelled
    query.cancelled = null

    // Return the unsubscribe function
    return () => {
      query.instances = query.instances.filter(d => d.id !== instance.id)

      if (!query.instances.length) {
        // Cancel any side-effects
        query.cancelled = cancelledError

        // Mark as inactive
        query.setState(old => {
          return {
            ...old,
            isInactive: true,
          }
        })

        // Schedule garbage collection
        query.cacheTimeout = setTimeout(
          () => {
            queries.splice(queries.findIndex(d => d === query), 1)
            globalStateListeners.forEach(d => d())
          },
          query.state.isCached ? config.cacheTime : 0
        )
      }
    }
  }

  // Set up the fetch function
  const tryFetchQueryPages = async pageVariables => {
    try {
      // Perform the query
      const data = await Promise.all(
        pageVariables.map(variables => queryFn(variables))
      )

      if (query.cancelled) throw query.cancelled

      return data
    } catch (error) {
      if (query.cancelled) throw query.cancelled

      // If we fail, increase the failureCount
      query.setState(old => {
        return {
          ...old,
          failureCount: old.failureCount + 1,
        }
      })

      // Do we need to retry the request?
      if (
        // Only retry if the document is visible
        config.retry === true ||
        query.state.failureCount < config.retry
      ) {
        if (!isDocumentVisible()) {
          return new Promise(r => {})
        }

        // Determine the retryDelay
        const delay =
          typeof config.retryDelay === 'function'
            ? config.retryDelay(query.state.failureCount)
            : config.retryDelay

        // Return a new promise with the retry
        return new Promise((resolve, reject) => {
          // Keep track of the retry timeout
          setTimeout(async () => {
            if (query.cancelled) return reject(query.cancelled)

            try {
              const data = await tryFetchQueryPages(pageVariables)
              if (query.cancelled) return reject(query.cancelled)
              resolve(data)
            } catch (error) {
              if (query.cancelled) return reject(query.cancelled)
              reject(error)
            }
          }, delay)
        })
      }

      throw error
    }
  }

  query.fetch = async ({
    variables = config.paginated && query.state.isCached
      ? query.pageVariables
      : query.variables,
    force,
    isFetchMore,
  } = {}) => {
    // Don't refetch fresh queries without force
    if (!query.state.isStale && !force) {
      return
    }

    // Create a new promise for the query cache if necessary
    if (!query.promise) {
      query.promise = (async () => {
        // If there are any retries pending for this query, kill them
        query.cancelled = null

        try {
          // Set up the query refreshing state
          query.setState(old => {
            return {
              ...old,
              error: null,
              isFetching: true,
              isFetchingMore: isFetchMore,
              failureCount: 0,
            }
          })

          variables =
            config.paginated && query.state.isCached && !isFetchMore
              ? variables
              : [variables]

          // Try to fetch
          let data = await tryFetchQueryPages(variables)

          // If we are paginating, and this is the first query or a fetch more
          // query, then store the variables in the pageVariables
          if (config.paginated && (isFetchMore || !query.state.isCached)) {
            query.pageVariables.push(variables[0])
          }

          // Set data and mark it as cached
          query.setState(old => {
            data = config.paginated
              ? isFetchMore
                ? [...old.data, data[0]]
                : data
              : data[0]

            return {
              ...old,
              data,
              isCached: true,
              isStale: false,
              ...(config.paginated && {
                canFetchMore: config.getCanFetchMore(
                  data[data.length - 1],
                  data
                ),
              }),
            }
          })

          return data
        } catch (error) {
          // As long as it's not a cancelled retry
          if (error !== query.cancelled) {
            // Store the error
            query.setState(old => {
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
          clearTimeout(query.staleTimeout)
          
          query.staleTimeout = setTimeout(() => {
            if (query) {
              query.setState(old => {
                return {
                  ...old,
                  isStale: true,
                }
              })
              if (config.autoRefetch) {
                query.fetch()
              }
            }
          }, config.staleTime)

          query.setState(old => {
            return {
              ...old,
              isFetching: false,
              isFetchingMore: false,
            }
          })
          delete query.promise
        }
      })()
    }

    return query.promise
  }

  query.setData = updater =>
    query.setState(old => ({
      ...old,
      data: typeof updater === 'function' ? updater(old.data) : updater,
    }))

  return query
}

export function useQuery(queryKey, queryFn, config = {}) {
  const instanceIdRef = React.useRef(uid++)
  const instanceId = instanceIdRef.current

  config = {
    ...defaultConfig,
    ...config,
  }

  const { manual } = config

  const [queryHash, queryGroup, variablesHash, variables] = getQueryInfo(
    queryKey
  )

  let query = queries.find(query => query.queryHash === queryHash)

  if (query) {
    query.config = config
    query.queryFn = queryFn
  } else {
    query = makeQuery({
      queryHash,
      queryGroup,
      variablesHash,
      variables,
      config,
      queryFn,
    })
    queries.push(query)
  }

  const [state, setState] = React.useState(query.state)

  const onStateUpdate = React.useCallback(newState => setState(newState), [])

  React.useEffect(() => {
    const unsubscribeFromQuery = query.subscribe({
      id: instanceId,
      onStateUpdate,
    })
    return unsubscribeFromQuery
  }, [instanceId, onStateUpdate, query])

  const isLoading = !queryHash || manual ? false : state.isCached ? false : true
  const refetch = query.fetch
  const setData = query.setData

  const fetchMore = React.useCallback(
    config.paginated
      ? variables => query.fetch({ variables, force: true, isFetchMore: true })
      : undefined,
    [query]
  )

  const getLatestManual = useGetLatest(manual)

  React.useEffect(() => {
    if (getLatestManual()) {
      return
    }

    const runRefetch = async () => {
      try {
        await query.fetch()
      } catch (err) {
        console.error(err)
        // Swallow this error. Don't rethrow it into a render function
      }
    }

    runRefetch()
  }, [getLatestManual, query, queryHash])

  return {
    ...state,
    isLoading,
    refetch,
    fetchMore,
    setData,
  }
}

export async function refetchQuery(userQueryKey, { force } = {}) {
  const [, queryGroup, variablesHash, variables] = getQueryInfo(userQueryKey)

  if (!queryGroup) {
    return
  }

  return Promise.all(
    queries.map(async query => {
      if (query.queryGroup !== queryGroup) {
        return
      }

      if (variables === false && query.variablesHash) {
        return
      }

      if (variablesHash && query.variablesHash !== variablesHash) {
        return
      }

      await query.fetch({ force })
    })
  )
}

export function useMutation(
  mutationFn,
  { refetchQueries, refetchQueriesOnFailure } = {}
) {
  const [data, setData] = React.useState(null)
  const [error, setError] = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const mutationFnRef = React.useRef()
  mutationFnRef.current = mutationFn

  const mutate = React.useCallback(
    async (variables, { updateQuery, waitForRefetchQueries = false } = {}) => {
      setIsLoading(true)
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
            console.error(err)
            // Swallow this error since it is a side-effect
          }
        }

        return res
      } catch (error) {
        setError(error)

        if (refetchQueriesOnFailure) {
          await doRefetchQueries()
        }
      } finally {
        setIsLoading(false)
      }
    },
    [refetchQueriesOnFailure, refetchQueries]
  )

  return [mutate, { data, isLoading, error }]
}

export function _useQueries() {
  const [state, setState] = React.useState({ queries })

  React.useEffect(() => {
    const fn = () => {
      setState({ queries })
    }

    globalStateListeners.push(fn)

    return () => {
      globalStateListeners = globalStateListeners.filter(d => d !== fn)
    }
  }, [])

  return state.queries
}

export function useIsFetching() {
  const queries = _useQueries()

  return React.useMemo(() => queries.some(query => query.isFetching), [queries])
}

export function setQueryData(
  userQueryKey,
  updater,
  { shouldRefetch = true } = {}
) {
  const [queryHash] = getQueryInfo(userQueryKey)

  if (!queryHash) {
    return
  }

  const query = queries.find(d => d.queryHash === queryHash)

  query.setData(updater)

  if (shouldRefetch) {
    return refetchQuery(userQueryKey)
  }
}

export async function refetchAllQueries({ force } = {}) {
  return Promise.all(queries.map(async query => query.fetch({ force })))
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

function useGetLatest(obj) {
  const ref = React.useRef()
  ref.current = obj

  return React.useCallback(() => ref.current, [])
}
