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
} from './utils'
import { defaultConfigRef } from './config'

export const queryCache = makeQueryCache()

const actionInit = {}
const actionFailed = {}
const actionMarkStale = {}
const actionFetch = {}
const actionSuccess = {}
const actionError = {}
const actionSetData = {}

export function makeQueryCache() {
  const listeners = []

  const cache = {
    queries: {},
    isFetching: 0,
  }

  const notifyGlobalListeners = () => {
    listeners.forEach(d => d(cache))
    cache.isFetching = Object.values(queryCache.queries).reduce(
      (acc, query) => (query.state.isFetching ? acc + 1 : acc),
      0
    )
  }

  cache.subscribe = cb => {
    listeners.push(cb)
    return () => {
      listeners.splice(listeners.indexOf(cb), 1)
    }
  }

  cache.clear = () => {
    cache.queries = {}
    notifyGlobalListeners()
  }

  const findQueries = (predicate, { exact } = {}) => {
    if (typeof predicate !== 'function') {
      const [
        queryHash,
        queryKey,
      ] = defaultConfigRef.current.queryKeySerializerFn(predicate)
      predicate = d =>
        exact ? d.queryHash === queryHash : deepIncludes(d.queryKey, queryKey)
    }

    return Object.values(cache.queries).filter(predicate)
  }

  cache.getQuery = queryKey => findQueries(queryKey, { exact: true })[0]

  cache.getQueryData = queryKey => cache.getQuery(queryKey)?.state.data

  cache.removeQueries = (predicate, { exact } = {}) => {
    const foundQueries = findQueries(predicate, { exact })

    foundQueries.forEach(query => {
      delete cache.queries[query.queryHash]
    })

    if (foundQueries.length) {
      notifyGlobalListeners()
    }
  }

  cache.refetchQueries = async (
    predicate,
    { exact, throwOnError, force } = {}
  ) => {
    const foundQueries =
      predicate === true
        ? Object.values(cache.queries)
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

  cache._buildQuery = (userQueryKey, queryVariables, queryFn, config) => {
    let [queryHash, queryKey] = config.queryKeySerializerFn(userQueryKey)

    let query = cache.queries[queryHash]

    if (query) {
      Object.assign(query, { queryVariables, queryFn })
      Object.assign(query.config, config)
    } else {
      query = makeQuery({
        queryKey,
        queryHash,
        queryVariables,
        queryFn,
        config,
      })

      // If the query started with data, schedule
      // a stale timeout
      if (query.state.data) {
        query.scheduleStaleTimeout()

        // Simulate a query healing process
        query.heal()
        // Schedule for garbage collection in case
        // nothing subscribes to this query
        query.scheduleGarbageCollection()
      }

      if (query.queryHash) {
        if (!isServer) {
          cache.queries[queryHash] = query
          notifyGlobalListeners()
        }
      }
    }

    return query
  }

  cache.prefetchQuery = async (...args) => {
    let [
      queryKey,
      queryVariables,
      queryFn,
      { force, ...config },
    ] = getQueryArgs(args)

    config = {
      ...defaultConfigRef.current,
      ...config,
    }

    const query = cache._buildQuery(queryKey, queryVariables, queryFn, config)

    // Don't prefetch queries that are fresh, unless force is passed
    if (query.state.isStale || force) {
      // Trigger a fetch and return the promise
      try {
        const res = await query.fetch()
        query.wasPrefetched = true
        return res
      } catch (err) {
        if (config.throwOnError) {
          throw err
        }
      }
    }

    return query.state.data
  }

  cache.setQueryData = (queryKey, updater, { exact, ...config } = {}) => {
    let queries = findQueries(queryKey, { exact })

    if (!queries.length && typeof queryKey !== 'function') {
      queries = [
        cache._buildQuery(queryKey, undefined, () => new Promise(noop), {
          ...defaultConfigRef.current,
          ...config,
        }),
      ]
    }

    queries.forEach(d => d.setData(updater))
  }

  function makeQuery(options) {
    const reducer = options.config.queryReducer || defaultQueryReducer

    const noQueryHash = typeof options.queryHash === 'undefined'

    const initialData =
      typeof options.config.initialData === 'function'
        ? options.config.initialData()
        : options.config.initialData

    const hasInitialData = typeof initialData !== 'undefined'

    const isStale = noQueryHash ? true : !hasInitialData

    const manual = options.config.manual

    const initialStatus =
      noQueryHash || manual || hasInitialData ? statusSuccess : statusLoading

    const query = {
      ...options,
      instances: [],
      state: reducer(undefined, {
        type: actionInit,
        initialStatus,
        initialData,
        hasInitialData,
        isStale,
        manual,
      }),
    }

    const dispatch = action => {
      query.state = reducer(query.state, action)
      query.instances.forEach(d => d.onStateUpdate(query.state))
      notifyGlobalListeners()
    }

    query.scheduleStaleTimeout = () => {
      query.staleTimeout = setTimeout(() => {
        if (query) {
          dispatch({ type: actionMarkStale })
        }
      }, query.config.staleTime)
    }

    query.scheduleGarbageCollection = () => {
      query.cacheTimeout = setTimeout(
        () => {
          cache.removeQueries(d => d.queryHash === query.queryHash)
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

    query.subscribe = instance => {
      let found = query.instances.find(d => d.id === instance.id)

      if (found) {
        Object.assign(found, instance)
      } else {
        found = {
          onStateUpdate: noop,
          ...instance,
        }
        query.instances.push(instance)
      }

      query.heal()

      // Return the unsubscribe function
      return () => {
        query.instances = query.instances.filter(d => d.id !== instance.id)

        if (!query.instances.length) {
          // Cancel any side-effects
          query.cancelled = cancelledError

          if (query.cancelQueries) {
            query.cancelQueries()
          }

          // Schedule garbage collection
          query.scheduleGarbageCollection()
        }
      }
    }

    // Set up the fetch function
    const tryFetchData = async (queryFn, ...args) => {
      try {
        // Perform the query
        const promise = queryFn(...query.config.queryFnParamsFilter(args))

        query.cancelQueries = () => promise.cancel?.()

        const data = await promise

        delete query.cancelQueries
        if (query.cancelled) throw query.cancelled

        return data
      } catch (error) {
        delete query.cancelQueries
        if (query.cancelled) throw query.cancelled

        // If we fail, increase the failureCount
        dispatch({ type: actionFailed })

        // Do we need to retry the request?
        if (
          // Only retry if the document is visible
          query.config.retry === true ||
          query.state.failureCount <= query.config.retry
        ) {
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
      // Don't refetch fresh queries that don't have a queryHash

      if (!query.queryHash || (!query.state.isStale && !force)) {
        return
      }

      // Create a new promise for the query cache if necessary
      if (!query.promise) {
        query.promise = (async () => {
          // If there are any retries pending for this query, kill them
          query.cancelled = null

          try {
            // Set up the query refreshing state
            dispatch({ type: actionFetch })

            // Try to fetch
            let data = await tryFetchData(
              __queryFn,
              ...query.queryKey,
              ...query.queryVariables
            )

            query.setData(data)

            query.instances.forEach(
              instance =>
                instance.onSuccess && instance.onSuccess(query.state.data)
            )

            query.instances.forEach(
              instance =>
                instance.onSettled && instance.onSettled(query.state.data, null)
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
              query.instances.forEach(
                instance => instance.onError && instance.onError(error)
              )

              query.instances.forEach(
                instance =>
                  instance.onSettled && instance.onSettled(undefined, error)
              )

              // throw error
            }
          }
        })()
      }

      return query.promise
    }

    query.setData = updater => {
      // Set data and mark it as cached
      dispatch({ type: actionSuccess, updater })

      // Schedule a fresh invalidation!
      clearTimeout(query.staleTimeout)
      query.scheduleStaleTimeout()
    }

    return query
  }

  return cache
}

export function defaultQueryReducer(state, action) {
  switch (action.type) {
    case actionInit:
      return {
        status: action.initialStatus,
        error: null,
        isFetching: action.hasInitialData ? false : !action.manual,
        canFetchMore: false,
        failureCount: 0,
        isStale: action.isStale,
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
    case actionFetch:
      return {
        ...state,
        status: state.status === statusError ? statusLoading : state.status,
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
        ...(!action.cancelled && {
          status: statusError,
          error: action.error,
          isStale: true,
        }),
      }
    default:
      throw new Error()
  }
}
