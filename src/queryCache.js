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
  isObject,
} from './utils'
import { defaultConfigRef } from './config'

export const queryCache = makeQueryCache()

export const queryCacheContext = React.createContext(queryCache)

export const queryCaches = [queryCache]

export const useQueryCache = () => React.useContext(queryCacheContext)

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
      if (i > -1) {
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

const actionInit = 'Init'
const actionFailed = 'Failed'
const actionMarkStale = 'MarkStale'
const actionMarkGC = 'MarkGC'
const actionFetch = 'Fetch'
const actionSuccess = 'Success'
const actionError = 'Error'
const actionSetState = 'SetState'

export function makeQueryCache({ frozen = isServer, defaultConfig } = {}) {
  // A frozen cache does not add new queries to the cache
  const globalListeners = []

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

    globalListeners.forEach(d => d(queryCache))
  }

  queryCache.subscribe = cb => {
    globalListeners.push(cb)
    return () => {
      globalListeners.splice(globalListeners.indexOf(cb), 1)
    }
  }

  queryCache.clear = ({ notify = true } = {}) => {
    Object.values(queryCache.queries).forEach(query => query.clear())
    queryCache.queries = {}
    if (notify) {
      notifyGlobalListeners()
    }
  }

  queryCache.getQueries = (predicate, { exact } = {}) => {
    if (predicate === true) {
      return Object.values(queryCache.queries)
    }

    if (typeof predicate !== 'function') {
      const [
        queryHash,
        queryKey,
      ] = configRef.current.queries.queryKeySerializerFn(predicate)

      predicate = d =>
        exact ? d.queryHash === queryHash : deepIncludes(d.queryKey, queryKey)
    }

    return Object.values(queryCache.queries).filter(predicate)
  }

  queryCache.getQuery = queryKey =>
    queryCache.getQueries(queryKey, { exact: true })[0]

  queryCache.getQueryData = queryKey =>
    queryCache.getQuery(queryKey)?.state.data

  queryCache.removeQueries = (...args) => {
    queryCache.getQueries(...args).forEach(query => query.clear())
  }

  queryCache.cancelQueries = (...args) => {
    queryCache.getQueries(...args).forEach(query => query.cancel())
  }

  queryCache.invalidateQueries = async (
    predicate,
    { refetchActive = true, exact, throwOnError } = {}
  ) => {
    try {
      return await Promise.all(
        queryCache.getQueries(predicate, { exact }).map(query => {
          if (refetchActive && query.instances.length) {
            return query.fetch()
          }

          return query.invalidate()
        })
      )
    } catch (err) {
      if (throwOnError) {
        throw err
      }
    }
  }

  queryCache.resetErrorBoundaries = () => {
    queryCache.getQueries(true).forEach(query => {
      query.state.throwInErrorBoundary = false
    })
  }

  queryCache.buildQuery = (userQueryKey, config = {}) => {
    config = {
      ...configRef.current.shared,
      ...configRef.current.queries,
      ...config,
    }

    let [queryHash, queryKey] = config.queryKeySerializerFn(userQueryKey)

    let query = queryCache.queries[queryHash]

    if (query) {
      Object.assign(query, { config })
    } else {
      query = makeQuery({
        queryCache,
        queryKey,
        queryHash,
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

      if (!frozen) {
        queryCache.queries[queryHash] = query

        if (isServer) {
          notifyGlobalListeners()
        } else {
          // Here, we setTimeout so as to not trigger
          // any setState's in parent components in the
          // middle of the render phase.
          setTimeout(() => {
            notifyGlobalListeners()
          })
        }
      }
    }

    query.fallbackInstance = {
      config: {
        onSuccess: query.config.onSuccess,
        onError: query.config.onError,
        onSettled: query.config.onSettled,
      },
    }

    return query
  }

  queryCache.prefetchQuery = async (...args) => {
    if (
      isObject(args[1]) &&
      (args[1].hasOwnProperty('throwOnError') || args[1].hasOwnProperty('force'))
    ) {
      args[3] = args[1]
      args[1] = undefined
      args[2] = undefined
    }

    let [queryKey, config, { force, throwOnError } = {}] = getQueryArgs(args)

    try {
      const query = queryCache.buildQuery(queryKey, config)
      if (force || query.state.isStale) {
        await query.fetch()
      }
      return query.state.data
    } catch (err) {
      if (throwOnError) {
        throw err
      }
    }
  }

  queryCache.setQueryData = (queryKey, updater, config = {}) => {
    let query = queryCache.getQuery(queryKey)

    if (!query) {
      query = queryCache.buildQuery(queryKey, () => new Promise(noop), config)
    }

    query.setData(updater)
  }

  function makeQuery({ queryCache, queryKey, queryHash, config }) {
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

    let query = {
      queryKey,
      queryHash,
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

    query.dispatch = action => {
      query.state = queryReducer(query.state, action)
      query.instances.forEach(d => d.onStateUpdate(query.state))
      notifyGlobalListeners()
    }

    query.scheduleStaleTimeout = () => {
      if (isServer) return
      clearTimeout(query.staleTimeout)

      if (query.config.staleTime === Infinity) {
        return
      }

      query.staleTimeout = setTimeout(() => {
        if (queryCache.getQuery(query.queryKey)) {
          query.invalidate()
        }
      }, query.config.staleTime)
    }

    query.invalidate = () => {
      clearTimeout(query.staleTimeout)
      query.dispatch({ type: actionMarkStale })
    }

    query.scheduleGarbageCollection = () => {
      if (!queryCache.queries[query.queryHash]) return
      if (query.config.cacheTime === Infinity) {
        return
      }
      query.dispatch({ type: actionMarkGC })
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

      if (query.cancelPromises) {
        query.cancelPromises()
      }

      delete query.promise
    }

    query.clearIntervals = () => {
      query.instances.forEach(instance => {
        instance.clearInterval()
      })
    }

    query.setState = updater =>
      query.dispatch({ type: actionSetState, updater })

    query.setData = updater => {
      // Set data and mark it as cached
      query.dispatch({ type: actionSuccess, updater })

      // Schedule a fresh invalidation!
      query.scheduleStaleTimeout()
    }

    query.clear = () => {
      clearTimeout(query.staleTimeout)
      clearTimeout(query.cacheTimeout)
      clearTimeout(query.retryTimeout)
      query.clearIntervals()
      query.cancel()
      query.dispatch = noop
      delete queryCache.queries[query.queryHash]
    }

    query.subscribe = (onStateUpdate = noop) => {
      const instance = {
        id: uid(),
        onStateUpdate,
      }

      query.instances.push(instance)

      query.heal()

      instance.clearInterval = () => {
        clearInterval(instance.refetchIntervalId)
        delete instance.refetchIntervalId
      }

      instance.updateConfig = config => {
        const oldConfig = instance.config

        // Update the config
        instance.config = config

        if (!isServer) {
          if (oldConfig?.refetchInterval === config.refetchInterval) {
            return
          }

          query.clearIntervals()

          const minInterval = Math.min(
            ...query.instances.map(d => d.config.refetchInterval || Infinity)
          )

          if (
            !instance.refetchIntervalId &&
            minInterval > 0 &&
            minInterval < Infinity
          ) {
            instance.refetchIntervalId = setInterval(() => {
              if (
                isDocumentVisible() ||
                query.instances.some(
                  instance => instance.config.refetchIntervalInBackground
                )
              ) {
                query.fetch()
              }
            }, minInterval)
          }
        }
      }

      instance.run = async () => {
        try {
          // Perform the refetch for this query if necessary
          if (
            query.config.enabled && // Don't auto refetch if disabled
            !query.wasSuspended && // Don't double refetch for suspense
            query.state.isStale && // Only refetch if stale
            (query.config.refetchOnMount || query.instances.length === 1)
          ) {
            await query.fetch()
          }

          query.wasSuspended = false
        } catch (error) {
          Console.error(error)
        }
      }

      instance.unsubscribe = () => {
        query.instances = query.instances.filter(d => d.id !== instance.id)

        if (!query.instances.length) {
          query.clearIntervals()
          query.cancel()

          if (!isServer) {
            // Schedule garbage collection
            query.scheduleGarbageCollection()
          }
        }
      }

      return instance
    }

    // Set up the core fetcher function
    const tryFetchData = async (fn, ...args) => {
      try {
        // Perform the query
        const promise = fn(...query.config.queryFnParamsFilter(args))

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
        query.dispatch({ type: actionFailed })

        // Do we need to retry the request?
        if (
          query.config.retry === true ||
          query.state.failureCount <= query.config.retry ||
          (typeof query.config.retry === 'function' &&
            query.config.retry(query.state.failureCount, error))
        ) {
          // Only retry if the document is visible
          if (!isDocumentVisible()) {
            // set this flag to continue retries on focus
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
            query.retryTimeout = setTimeout(async () => {
              if (query.cancelled) return reject(query.cancelled)

              try {
                const data = await tryFetchData(fn, ...args)
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

    query.fetch = async ({ queryFn = query.config.queryFn } = {}) => {
      if (!queryFn) {
        return
      }
      // Create a new promise for the query cache if necessary
      if (!query.promise) {
        query.promise = (async () => {
          // If there are any retries pending for this query, kill them
          query.cancelled = null

          const getCallbackInstances = () => {
            const callbackInstances = [...query.instances]

            if (query.wasSuspended) {
              callbackInstances.unshift(query.fallbackInstance)
            }
            return callbackInstances
          }

          try {
            // Set up the query refreshing state
            query.dispatch({ type: actionFetch })

            // Try to get the data
            let data = await tryFetchData(queryFn, ...query.queryKey)

            query.setData(old =>
              query.config.isDataEqual(old, data) ? old : data
            )

            getCallbackInstances().forEach(
              instance =>
                instance.config.onSuccess &&
                instance.config.onSuccess(query.state.data)
            )

            getCallbackInstances().forEach(
              instance =>
                instance.config.onSettled &&
                instance.config.onSettled(query.state.data, null)
            )

            delete query.promise

            return data
          } catch (error) {
            query.dispatch({
              type: actionError,
              cancelled: error === query.cancelled,
              error,
            })

            delete query.promise

            if (error !== query.cancelled) {
              getCallbackInstances().forEach(
                instance =>
                  instance.config.onError && instance.config.onError(error)
              )

              getCallbackInstances().forEach(
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

    return query
  }

  return queryCache
}

export function queryReducer(state, action) {
  const newState = switchActions(state, action)

  Object.assign(newState, {
    isLoading: newState.status === statusLoading,
    isSuccess: newState.status === statusSuccess,
    isError: newState.status === statusError,
    isIdle: newState.status === statusIdle,
  })

  return newState
}

function switchActions(state, action) {
  switch (action.type) {
    case actionInit:
      return {
        status: action.initialStatus,
        error: null,
        isFetching: action.initialStatus === 'loading',
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
        status:
          typeof state.data !== 'undefined' ? statusSuccess : statusLoading,
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
          throwInErrorBoundary: true,
        }),
      }
    case actionSetState:
      return functionalUpdate(action.updater, state)
    default:
      throw new Error()
  }
}
