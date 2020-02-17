import React from 'react'

export let queries = []
const cancelledError = {}
export let globalStateListeners = []
let uid = 0
const configContext = React.createContext()
const isServer = typeof window === 'undefined'

const statusIdle = 'idle'
const statusLoading = 'loading'
const statusError = 'error'
const statusSuccess = 'success'

const actionInit = {}
const actionActivate = {}
const actionDeactivate = {}
const actionFailed = {}
const actionMarkStale = {}
const actionFetch = {}
const actionSuccess = {}
const actionError = {}
const actionSetData = {}

let defaultConfig = {
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 0,
  cacheTime: 5 * 60 * 1000,
  refetchAllOnWindowFocus: true,
  refetchInterval: false,
  suspense: false,
  queryKeySerializerFn: defaultQueryKeySerializerFn,
}

const onWindowFocus = () => {
  const { refetchAllOnWindowFocus } = defaultConfig

  if (isDocumentVisible() && isOnline()) {
    refetchAllQueries({
      shouldRefetchQuery: query => {
        if (typeof query.config.refetchOnWindowFocus === 'undefined') {
          return refetchAllOnWindowFocus
        } else {
          return query.config.refetchOnWindowFocus
        }
      },
    }).catch(error => {
      console.error(error.message)
    })
  }
}

let removePreviousHandler

export function setFocusHandler(callback) {
  // Unsub the old watcher
  if (removePreviousHandler) {
    removePreviousHandler()
  }
  // Sub the new watcher
  removePreviousHandler = callback(onWindowFocus)
}

setFocusHandler(handleFocus => {
  // Listen to visibillitychange and focus
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('visibilitychange', handleFocus, false)
    window.addEventListener('focus', handleFocus, false)

    return () => {
      // Be sure to unsubscribe if a new handler is set
      window.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
    }
  }
})

export function ReactQueryConfigProvider({ config, children }) {
  let configContextValue = React.useContext(configContext)

  const newConfig = React.useMemo(
    () => ({
      ...(configContextValue || defaultConfig),
      ...config,
    }),
    [config, configContextValue]
  )

  if (!configContextValue) {
    defaultConfig = newConfig
  }

  return (
    <configContext.Provider value={newConfig}>
      {children}
    </configContext.Provider>
  )
}

function useConfigContext() {
  return React.useContext(configContext) || defaultConfig
}

function queryReducer(state, action) {
  switch (action.type) {
    case actionInit:
      return {
        status: action.options.config.manual ? statusIdle : statusLoading,
        error: null,
        isFetching: action.options.config.manual ? false : true,
        isFetchingMore: false,
        canFetchMore: false,
        failureCount: 0,
        isCached: false,
        isStale: true,
        data: action.initialData,
      }
    case actionActivate:
      return {
        ...state,
        isInactive: false,
      }
    case actionDeactivate:
      return {
        ...state,
        isInactive: true,
      }
    case actionFailed:
      return {
        ...state,
        failureCount: state.failureCount + 1,
      }
    case actionMarkStale:
      return {
        ...state,
        isStale: true,
      }
    case actionFetch:
      return {
        ...state,
        status: state.status === statusError ? statusLoading : state.status,
        isFetching: true,
        isFetchingMore: action.isFetchMore,
        failureCount: 0,
      }
    case actionSuccess:
      const newData = action.paginated
        ? action.isFetchMore
          ? [...state.data, action.data[0]]
          : action.data
        : action.data[0]

      return {
        ...state,
        status: statusSuccess,
        data: newData,
        error: null,
        isCached: true,
        isStale: false,
        isFetching: false,
        isFetchingMore: false,
        canFetchMore: action.canFetchMore,
      }
    case actionError:
      return {
        ...state,
        isFetching: false,
        isFetchingMore: false,
        ...(!action.cancelled && {
          status: statusError,
          error: action.error,
          isCached: false,
          isStale: true,
        }),
      }
    case actionSetData:
      return {
        ...state,
        data: functionalUpdate(action.updater, state.data),
      }
    default:
      throw new Error()
  }
}

function makeQuery(options) {
  let initialData = options.config.paginated ? [] : undefined

  if (typeof options.config.initialData !== 'undefined') {
    initialData = options.config.initialData
  }

  let query = {
    ...options,
    pageVariables: [],
    instances: [],
    state: queryReducer(undefined, { type: actionInit, options, initialData }),
    // promise: null,
    // staleTimeout: null,
    // cacheTimeout: null,
    // cancelled: null,
  }

  query.dispatch = action => {
    query.state = queryReducer(query.state, action)
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

    // Mark as active
    query.dispatch({ type: actionActivate })

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

        if (query.cancelQueries) {
          query.cancelQueries()
        }

        // Mark as inactive
        query.dispatch({ type: actionDeactivate })

        // Schedule garbage collection
        query.cacheTimeout = setTimeout(
          () => {
            queries.splice(queries.findIndex(d => d === query), 1)
            globalStateListeners.forEach(d => d())
          },
          query.state.isCached ? query.config.cacheTime : 0
        )
      }
    }
  }

  // Set up the fetch function
  const tryFetchQueryPages = async pageVariables => {
    try {
      // Perform the query
      const promises = pageVariables.map(variables => query.queryFn(variables))

      query.cancelQueries = () =>
        promises.map(({ cancel }) => cancel && cancel())

      const data = await Promise.all(promises)

      if (query.cancelled) throw query.cancelled

      return data
    } catch (error) {
      if (query.cancelled) throw query.cancelled

      // If we fail, increase the failureCount
      query.dispatch({ type: actionFailed })

      // Do we need to retry the request?
      if (
        // Only retry if the document is visible
        query.config.retry === true ||
        query.state.failureCount < query.config.retry
      ) {
        if (!isDocumentVisible()) {
          return new Promise(r => {})
        }

        // Determine the retryDelay
        const delay = functionalUpdate(
          query.config.retryDelay,
          query.state.failureCount
        )

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
    variables = query.config.paginated && query.state.isCached
      ? query.pageVariables
      : query.variables,
    force,
    isFetchMore,
  } = {}) => {
    // Don't refetch fresh queries without force
    if (!query.queryHash || (!query.state.isStale && !force)) {
      return
    }

    // Create a new promise for the query cache if necessary
    if (!query.promise) {
      query.promise = (async () => {
        // If there are any retries pending for this query, kill them
        query.cancelled = null

        const cleanup = () => {
          delete query.promise

          // Schedule a fresh invalidation, always!
          clearTimeout(query.staleTimeout)

          query.staleTimeout = setTimeout(() => {
            if (query) {
              query.dispatch({ type: actionMarkStale })
            }
          }, query.config.staleTime)
        }

        try {
          // Set up the query refreshing state
          query.dispatch({ type: actionFetch })

          variables =
            query.config.paginated && query.state.isCached && !isFetchMore
              ? variables
              : [variables]

          // Try to fetch
          let data = await tryFetchQueryPages(variables)

          // If we are paginating, and this is the first query or a fetch more
          // query, then store the variables in the pageVariables
          if (
            query.config.paginated &&
            (isFetchMore || !query.state.isCached)
          ) {
            query.pageVariables.push(variables[0])
          }

          // Set data and mark it as cached
          query.dispatch({
            type: actionSuccess,
            data,
            paginated: query.config.paginated,
            isFetchMore,
            canFetchMore:
              query.config.paginated &&
              query.config.getCanFetchMore(data[data.length - 1], data),
          })

          query.instances.forEach(
            instance =>
              instance.onSuccess && instance.onSuccess(query.state.data)
          )

          cleanup()

          return data
        } catch (error) {
          query.dispatch({
            type: actionError,
            cancelled: error === query.cancelled,
            error,
          })

          cleanup()

          if (error !== query.cancelled) {
            query.instances.forEach(
              instance => instance.onError && instance.onError(error)
            )

            throw error
          }
        }
      })()
    }

    return query.promise
  }

  query.setData = updater => query.dispatch({ type: actionSetData, updater })

  return query
}

export function useQuery(queryKey, queryFn, config = {}) {
  const isMountedRef = React.useRef(false)
  const wasSuspendedRef = React.useRef(false)
  const instanceIdRef = React.useRef(uid++)
  const instanceId = instanceIdRef.current

  config = {
    ...useConfigContext(),
    ...config,
  }

  const { manual } = config

  const [
    queryHash,
    queryGroup,
    variablesHash,
    variables,
  ] = config.queryKeySerializerFn(queryKey)

  let query = queries.find(query => query.queryHash === queryHash)

  let wasPrefetched

  if (query) {
    wasPrefetched = query.config.prefetch
    query.config = config
    if (!isMountedRef.current) {
      query.config.prefetch = wasPrefetched
    }
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
    if (!isServer) {
      queries.push(query)
    }
  }

  React.useEffect(() => {
    if (config.refetchInterval && !query.refetchInterval) {
      query.refetchInterval = setInterval(() => {
        if (isDocumentVisible() || config.refetchIntervalInBackground) {
          query.fetch()
        }
      }, config.refetchInterval)

      return () => {
        clearInterval(query.refetchInterval)
        query.refetchInterval = null
      }
    }
  }, [config.refetchInterval, config.refetchIntervalInBackground, query])

  const [state, setState] = React.useState(query.state)

  const onStateUpdate = React.useCallback(newState => setState(newState), [])
  const getLatestOnError = useGetLatest(config.onError)
  const getLatestOnSuccess = useGetLatest(config.onSuccess)

  React.useEffect(() => {
    const unsubscribeFromQuery = query.subscribe({
      id: instanceId,
      onStateUpdate,
      onSuccess: data => getLatestOnSuccess() && getLatestOnSuccess()(data),
      onError: err => getLatestOnError() && getLatestOnError()(err),
    })
    return unsubscribeFromQuery
  }, [getLatestOnError, getLatestOnSuccess, instanceId, onStateUpdate, query])

  const refetch = query.fetch
  const setData = query.setData

  const fetchMore = React.useCallback(
    config.paginated
      ? paginationVariables =>
          query.fetch({
            variables: paginationVariables,
            force: true,
            isFetchMore: true,
          })
      : undefined,
    [query]
  )

  const getLatestManual = useGetLatest(manual)

  React.useEffect(() => {
    if (getLatestManual()) {
      return
    }

    if (config.suspense) {
      if (wasSuspendedRef.current || wasPrefetched) {
        return
      }
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
  }, [config.suspense, getLatestManual, query, wasPrefetched])

  React.useEffect(() => {
    isMountedRef.current = true
  }, [])

  if (config.suspense) {
    if (state.error) {
      throw state.error
    }
    if (!state.isCached) {
      wasSuspendedRef.current = true
      throw query.fetch()
    }
  }

  wasSuspendedRef.current = false

  return {
    ...state,
    refetch,
    fetchMore,
    setData,
  }
}

export async function prefetchQuery(queryKey, queryFn, config = {}) {
  config = {
    ...defaultConfig,
    ...config,
    prefetch: true,
  }

  const [
    queryHash,
    queryGroup,
    variablesHash,
    variables,
  ] = defaultConfig.queryKeySerializerFn(queryKey)

  // If we're prefetching, use the queryFn to make the fetch call

  let query = queries.find(query => query.queryHash === queryHash)

  if (query) {
    if (!config.force) {
      return
    }
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
    if (!isServer) {
      queries.push(query)
    }
  }

  // Trigger a query subscription with one-time unique id
  const unsubscribeFromQuery = query.subscribe({
    id: uid++,
    onStateUpdate: () => {},
  })

  // Trigger a fetch and return the promise
  try {
    return await query.fetch({ force: config.force })
  } finally {
    // Since this is not a hook, upsubscribe after we're done
    unsubscribeFromQuery()
  }
}

export async function refetchQuery(queryKey, config = {}) {
  const [
    ,
    queryGroup,
    variablesHash,
    variables,
  ] = defaultConfig.queryKeySerializerFn(queryKey)

  // If we're simply refetching an existing query, then go find them
  // and call their fetch functions

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

      await query.fetch({ force: config.force })
    })
  )
}

export function useMutation(
  mutationFn,
  { refetchQueries, refetchQueriesOnFailure } = {}
) {
  const [data, setData] = React.useState(null)
  const [error, setError] = React.useState(null)
  const [status, setStatus] = React.useState('idle')
  const mutationFnRef = React.useRef()
  mutationFnRef.current = mutationFn

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
            console.error(err)
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
        throw error
      }
    },
    [refetchQueriesOnFailure, refetchQueries]
  )

  return [mutate, { data, status, error }]
}

export function useIsFetching() {
  const [state, setState] = React.useState({})
  const ref = React.useRef()

  if (!ref.current) {
    ref.current = () => {
      setState({})
    }
    globalStateListeners.push(ref.current)
  }

  React.useEffect(() => {
    return () => {
      globalStateListeners = globalStateListeners.filter(d => d !== ref.current)
    }
  }, [])

  return React.useMemo(
    () => state && queries.some(query => query.state.isFetching),
    [state]
  )
}

export function setQueryData(
  userQueryKey,
  updater,
  { shouldRefetch = true } = {}
) {
  const [queryHash] = defaultConfig.queryKeySerializerFn(userQueryKey)

  if (!queryHash) {
    return
  }

  const query = queries.find(d => d.queryHash === queryHash)

  if (!query) {
    return
  }

  query.setData(updater)

  if (shouldRefetch) {
    return refetchQuery(userQueryKey)
  }
}

export async function refetchAllQueries({
  includeInactive,
  force = includeInactive,
  shouldRefetchQuery,
} = {}) {
  return Promise.all(
    queries.map(async query => {
      if (
        typeof shouldRefetchQuery !== 'undefined' &&
        !shouldRefetchQuery(query)
      ) {
        return
      }
      if (query.instances.length || includeInactive) {
        return query.fetch({ force })
      }
    })
  )
}

export function clearQueryCache() {
  queries.length = 0
}

function defaultQueryKeySerializerFn(queryKey) {
  if (!queryKey) {
    return []
  }

  if (typeof queryKey === 'function') {
    try {
      return defaultQueryKeySerializerFn(queryKey())
    } catch {
      return []
    }
  }

  if (Array.isArray(queryKey)) {
    let [id, variables] = queryKey
    const variablesIsObject = isObject(variables)

    if (typeof id !== 'string' || (variables && !variablesIsObject)) {
      console.warn('Tuple queryKey:', queryKey)
      throw new Error(
        `Invalid query key tuple type: [${typeof id}, and ${typeof variables}]`
      )
    }

    const variablesHash = variablesIsObject ? stableStringify(variables) : ''

    return [
      `${id}${variablesHash ? `_${variablesHash}` : ''}`,
      id,
      variablesHash,
      variables,
    ]
  }

  return [queryKey, queryKey]
}

function stableStringifyReplacer(_, value) {
  return isObject(value)
    ? Object.assign(
        {},
        ...Object.keys(value)
          .sort()
          .map(key => ({
            [key]: value[key],
          }))
      )
    : Array.isArray(value)
    ? value
    : String(value)
}

export function stableStringify(obj) {
  return JSON.stringify(obj, stableStringifyReplacer)
}

function isObject(a) {
  return a && typeof a === 'object' && !Array.isArray(a)
}

function isDocumentVisible() {
  return (
    typeof document === 'undefined' ||
    document.visibilityState === undefined ||
    document.visibilityState === 'visible' ||
    document.visibilityState === 'prerender'
  )
}

function isOnline() {
  return navigator.onLine === undefined || navigator.onLine
}

function useGetLatest(obj) {
  const ref = React.useRef()
  ref.current = obj

  return React.useCallback(() => ref.current, [])
}

function functionalUpdate(updater, old) {
  return typeof updater === 'function' ? updater(old) : updater
}
