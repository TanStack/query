import React from 'react'
import {
  isServer,
  functionalUpdate,
  cancelledError,
  isDocumentVisible,
  statusLoading,
  statusSuccess,
  statusError,
  getQueryArgs,
  deepIncludes,
  noop,
  uid,
  statusIdle,
  Console,
} from './utils'
import { defaultConfigRef } from './config'

export const queryCache = makeQueryCache()

export const queryCacheContext = React.createContext(queryCache)

export const queryCaches = [queryCache]

export function useQueryCache() {
  return React.useContext(queryCacheContext)
}

export function ReactQueryCacheProvider({ queryCache, children }) {
  const resolvedQueryCache = React.useMemo(
    () => queryCache || makeQueryCache(),
    [queryCache]
  )

  React.useEffect(() => {
    queryCaches.push(resolvedQueryCache)

    return () => {
      // remove the cache from the active list
      const i = queryCaches.indexOf(resolvedQueryCache)
      if (i >= 0) {
        queryCaches.splice(i, 1)
      }
      // if the resolvedQueryCache was created by us, we need to tear it down
      if (queryCache == null) {
        resolvedQueryCache.clear()
      }
    }
  }, [resolvedQueryCache, queryCache])

  return (
    <queryCacheContext.Provider value={resolvedQueryCache}>
      {children}
    </queryCacheContext.Provider>
  )
}

const actionInit = {}
const actionFailed = {}
const actionMarkStale = {}
const actionMarkGC = {}
const actionFetch = {}
const actionSuccess = {}
const actionError = {}
const actionSetState = {}

export function makeQueryCache(defaultConfig) {
  const listeners = []

  const configRef = defaultConfig
    ? { current: defaultConfig }
    : defaultConfigRef

  const queryCache = {
    queries: {},
    isFetching: 0,
  }

  const notifyGlobalListeners = () => {
    queryCache.isFetching = Object.values(queryCache.queries).reduce(
      (acc, query) => (query.state.isFetching ? acc + 1 : acc),
      0
    )
    listeners.forEach(d => d(queryCache))
  }

  queryCache.subscribe = cb => {
    listeners.push(cb)
    return () => {
      listeners.splice(listeners.indexOf(cb), 1)
    }
  }

  queryCache.clear = () => {
    Object.values(queryCache.queries).forEach(query => query.clear())
    queryCache.queries = {}
    notifyGlobalListeners()
  }

  const findQueries = (predicate, { exact } = {}) => {
    if (typeof predicate !== 'function') {
      const [
        queryHash,
        queryKey,
      ] = configRef.current.shared.queryKeySerializerFn(predicate)
      predicate = d =>
        exact ? d.queryHash === queryHash : deepIncludes(d.queryKey, queryKey)
    }

    return Object.values(queryCache.queries).filter(predicate)
  }

  queryCache.getQueries = findQueries

  queryCache.getQuery = queryKey => findQueries(queryKey, { exact: true })[0]

  queryCache.getQueryData = queryKey =>
    queryCache.getQuery(queryKey)?.state.data

  queryCache.removeQueries = (predicate, { exact } = {}) => {
    const foundQueries = findQueries(predicate, { exact })

    foundQueries.forEach(query => {
      clearTimeout(query.staleTimeout)
      delete queryCache.queries[query.queryHash]
    })

    if (foundQueries.length) {
      notifyGlobalListeners()
    }
  }

  queryCache.cancelQueries = (predicate, { exact } = {}) => {
    const foundQueries = findQueries(predicate, { exact })

    foundQueries.forEach(query => {
      query.cancel()
    })

    if (foundQueries.length) {
      notifyGlobalListeners()
    }
  }

  queryCache.refetchQueries = async (
    predicate,
    { exact, throwOnError, force } = {}
  ) => {
    const foundQueries =
      predicate === true
        ? Object.values(queryCache.queries)
        : findQueries(predicate, { exact })

    try {
      return await Promise.all(
        foundQueries.map(query => query.fetch({ force }))
      )
    } catch (err) {
      if (throwOnError) {
        throw err
      }
    }
  }

  queryCache.buildQuery = (userQueryKey, queryFn, config) => {
    let [queryHash, queryKey] = config.queryKeySerializerFn(userQueryKey)

    let query = queryCache.queries[queryHash]

    if (query) {
      Object.assign(query, { queryFn, config })
    } else {
      query = makeQuery({
        queryCache,
        queryKey,
        queryHash,
        queryFn,
        config,
      })

      // If the query started with data, schedule
      // a stale timeout
      if (!isServer && query.state.data) {
        query.scheduleStaleTimeout()

        // Simulate a query healing process
        query.heal()
        // Schedule for garbage collection in case
        // nothing subscribes to this query
        query.scheduleGarbageCollection()
      }

      if (!isServer) {
        queryCache.queries[queryHash] = query
        // Here, we setTimeout so as to not trigger
        // any setState's in parent components in the
        // middle of the render phase.
        setTimeout(() => {
          notifyGlobalListeners()
        })
      }
    }

    query.suspenseInstance = {
      config: {
        onSuccess: query.config.onSuccess,
        onError: query.config.onError,
        onSettled: query.config.onSettled,
      },
    }

    if (!isServer) {
      query.cancelInterval()
      if (config.refetchInterval) {
        query.currentRefetchInterval = config.refetchInterval
        query.refetchIntervalId = setInterval(() => {
          if (isDocumentVisible() || config.refetchIntervalInBackground) {
            query.fetch()
          }
        }, config.refetchInterval)
      }
    }

    return query
  }

  queryCache.prefetchQuery = async (...args) => {
    let [
      queryKey,
      queryFn,
      config = {},
      { force, throwOnError } = {},
    ] = getQueryArgs(args)

    config = {
      ...configRef.current.shared,
      ...configRef.current.queries,
      ...config,
    }

    const query = queryCache.buildQuery(queryKey, queryFn, config)

    // Don't prefetch queries that are fresh, unless force is passed
    if (query.state.isStale || force) {
      // Trigger a fetch and return the promise
      try {
        const res = await query.fetch({ force })
        query.wasPrefetched = true
        return res
      } catch (err) {
        if (throwOnError) {
          throw err
        }
      }
    }

    return query.state.data
  }

  queryCache.setQueryData = (queryKey, updater, { exact, ...config } = {}) => {
    let queries = findQueries(queryKey, { exact })

    if (!queries.length && typeof queryKey !== 'function') {
      queries = [
        queryCache.buildQuery(queryKey, () => new Promise(noop), {
          ...configRef.current.shared,
          ...configRef.current.queries,
          ...config,
        }),
      ]
    }

    queries.forEach(d => d.setData(updater))
  }

  function makeQuery({ queryCache, queryKey, queryHash, queryFn, config }) {
    const initialData =
      typeof config.initialData === 'function'
        ? config.initialData()
        : config.initialData

    const hasInitialData = typeof initialData !== 'undefined'

    const isStale = !config.enabled || !hasInitialData

    const initialStatus = hasInitialData
      ? statusSuccess
      : config.enabled
      ? statusLoading
      : statusIdle

    const query = {
      queryKey,
      queryHash,
      queryFn,
      config,
      instances: [],
      state: queryReducer(undefined, {
        type: actionInit,
        initialStatus,
        initialData,
        hasInitialData,
        isStale,
      }),
    }

    const dispatch = action => {
      query.state = queryReducer(query.state, action)
      query.instances.forEach(d => d.onStateUpdate(query.state))
      notifyGlobalListeners()
    }

    query.scheduleStaleTimeout = () => {
      if (query.config.staleTime === Infinity) {
        return
      }

      query.staleTimeout = setTimeout(() => {
        if (queryCache.getQuery(query.queryKey)) {
          dispatch({ type: actionMarkStale })
        }
      }, query.config.staleTime)
    }

    query.scheduleGarbageCollection = () => {
      if (query.config.cacheTime === Infinity) {
        return
      }
      dispatch({ type: actionMarkGC })
      query.cacheTimeout = setTimeout(
        () => {
          queryCache.removeQueries(
            d =>
              d.state.markedForGarbageCollection &&
              d.queryHash === query.queryHash
          )
        },
        typeof query.state.data === 'undefined' &&
          query.state.status !== 'error'
          ? 0
          : query.config.cacheTime
      )
    }

    query.heal = () => {
      // Stop the query from being garbage collected
      clearTimeout(query.cacheTimeout)

      // Mark the query as not cancelled
      query.cancelled = null
    }

    query.cancel = () => {
      query.cancelled = cancelledError

      query.cancelInterval()

      if (query.cancelPromises) {
        query.cancelPromises()
      }

      delete query.promise

      notifyGlobalListeners()
    }

    query.cancelInterval = () => {
      clearInterval(query.refetchIntervalId)
      delete query.refetchIntervalId
      delete query.currentRefetchInterval
    }

    query.subscribe = (onStateUpdate = noop) => {
      const instance = {
        id: uid(),
        onStateUpdate,
      }

      query.instances.push(instance)

      query.heal()

      instance.updateConfig = config => {
        instance.config = config
      }

      instance.run = async () => {
        // Perform the fetch for this query if necessary
        if (
          query.config.enabled && // Don't auto fetch if disabled
          !query.wasPrefetched && // Don't double fetch for prefetched queries
          !query.wasSuspended && // Don't double fetch for suspense
          query.state.isStale && // Only refetch if stale
          (query.config.refetchOnMount || query.instances.length === 1)
        ) {
          try {
            await query.fetch()
          } catch (error) {
            Console.error(error)
          }
        }

        query.wasPrefetched = false
        query.wasSuspended = false
      }

      instance.unsubscribe = () => {
        query.instances = query.instances.filter(d => d.id !== instance.id)

        if (!query.instances.length) {
          query.cancel()

          // Schedule garbage collection
          query.scheduleGarbageCollection()
        }
      }

      return instance
    }

    // Set up the fetch function
    const tryFetchData = async (queryFn, ...args) => {
      try {
        // Perform the query
        const promise = queryFn(...query.config.queryFnParamsFilter(args))

        query.cancelPromises = () => promise.cancel?.()

        const data = await promise
        delete query.shouldContinueRetryOnFocus

        delete query.cancelPromises
        if (query.cancelled) throw query.cancelled

        return data
      } catch (error) {
        delete query.cancelPromises
        if (query.cancelled) throw query.cancelled

        // If we fail, increase the failureCount
        dispatch({ type: actionFailed })

        // Do we need to retry the request?
        if (
          query.config.retry === true ||
          query.state.failureCount <= query.config.retry ||
          (typeof query.config.retry === 'function' &&
            query.config.retry(query.state.failureCount, error))
        ) {
          // Only retry if the document is visible
          if (!isDocumentVisible()) {
            // set this flag to continue fetch retries on focus
            query.shouldContinueRetryOnFocus = true
            return new Promise(noop)
          }

          delete query.shouldContinueRetryOnFocus

          // Determine the retryDelay
          const delay = functionalUpdate(
            query.config.retryDelay,
            query.state.failureCount
          )

          // Return a new promise with the retry
          return await new Promise((resolve, reject) => {
            // Keep track of the retry timeout
            setTimeout(async () => {
              if (query.cancelled) return reject(query.cancelled)

              try {
                const data = await tryFetchData(queryFn, ...args)
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

    query.fetch = async ({ force, __queryFn = query.queryFn } = {}) => {
      if (!query.state.isStale && !force) {
        return
      }

      // Create a new promise for the query cache if necessary
      if (!query.promise) {
        query.promise = (async () => {
          // If there are any retries pending for this query, kill them
          query.cancelled = null

          const callbackInstances = [...query.instances]

          if (query.wasSuspended) {
            callbackInstances.unshift(query.suspenseInstance)
          }

          try {
            // Set up the query refreshing state
            dispatch({ type: actionFetch })

            // Try to fetch
            let data = await tryFetchData(__queryFn, ...query.queryKey)

            query.setData(old =>
              query.config.isDataEqual(old, data) ? old : data
            )

            callbackInstances.forEach(
              instance =>
                instance.config.onSuccess &&
                instance.config.onSuccess(query.state.data)
            )

            callbackInstances.forEach(
              instance =>
                instance.config.onSettled &&
                instance.config.onSettled(query.state.data, null)
            )

            delete query.promise

            return data
          } catch (error) {
            dispatch({
              type: actionError,
              cancelled: error === query.cancelled,
              error,
            })

            delete query.promise

            if (error !== query.cancelled) {
              callbackInstances.forEach(
                instance =>
                  instance.config.onError && instance.config.onError(error)
              )

              callbackInstances.forEach(
                instance =>
                  instance.config.onSettled &&
                  instance.config.onSettled(undefined, error)
              )

              throw error
            }
          }
        })()
      }

      return query.promise
    }

    query.setState = updater => dispatch({ type: actionSetState, updater })

    query.setData = updater => {
      // Set data and mark it as cached
      dispatch({ type: actionSuccess, updater })

      // Schedule a fresh invalidation!
      clearTimeout(query.staleTimeout)
      query.scheduleStaleTimeout()
    }

    query.clear = () => {
      clearTimeout(query.staleTimeout)
      clearTimeout(query.cacheTimeout)
      query.cancel()
    }

    return query
  }

  return queryCache
}

export function queryReducer(state, action) {
  const newState = switchActions(state, action)

  Object.assign(newState, {
    isLoading: newState.status === 'loading',
    isSuccess: newState.status === 'success',
    isError: newState.status === 'error',
    isIdle: newState.status === 'idle',
  })

  return newState
}

function switchActions(state, action) {
  switch (action.type) {
    case actionInit:
      return {
        status: action.initialStatus,
        error: null,
        isFetching:
          !action.hasInitialData || action.initialStatus === 'loading',
        canFetchMore: false,
        failureCount: 0,
        isStale: action.isStale,
        markedForGarbageCollection: false,
        data: action.initialData,
        updatedAt: action.hasInitialData ? Date.now() : 0,
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
    case actionMarkGC: {
      return {
        ...state,
        markedForGarbageCollection: true,
      }
    }
    case actionFetch:
      return {
        ...state,
        status: state.status === statusSuccess ? state.status : statusLoading,
        isFetching: true,
        failureCount: 0,
      }
    case actionSuccess:
      return {
        ...state,
        status: statusSuccess,
        data: functionalUpdate(action.updater, state.data),
        error: null,
        isStale: false,
        isFetching: false,
        canFetchMore: action.canFetchMore,
        updatedAt: Date.now(),
        failureCount: 0,
      }
    case actionError:
      return {
        ...state,
        isFetching: false,
        isStale: true,
        ...(!action.cancelled && {
          status: statusError,
          error: action.error,
        }),
      }
    case actionSetState:
      return functionalUpdate(action.updater, state)
    default:
      throw new Error()
  }
}
