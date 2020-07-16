import {
  isServer,
  functionalUpdate,
  cancelledError,
  isDocumentVisible,
  statusLoading,
  statusSuccess,
  statusError,
  noop,
  statusIdle,
  Console,
  getStatusBools,
} from './utils'
import { makeQueryInstance } from './queryInstance'

const actionInit = 'Init'
const actionFailed = 'Failed'
const actionMarkStale = 'MarkStale'
const actionMarkGC = 'MarkGC'
const actionFetch = 'Fetch'
const actionSuccess = 'Success'
const actionError = 'Error'
const actionSetState = 'SetState'

export function makeQuery({
  queryCache,
  queryKey,
  queryHash,
  config,
  notifyGlobalListeners,
}) {
  const initialData =
    typeof config.initialData === 'function'
      ? config.initialData()
      : config.initialData

  const hasInitialData = typeof initialData !== 'undefined'

  const isStale =
    !config.enabled ||
    (typeof config.initialStale === 'function'
      ? config.initialStale()
      : config.initialStale ?? !hasInitialData)

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
    notifyGlobalListeners(query)
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
      typeof query.state.data === 'undefined' && query.state.status !== 'error'
        ? 0
        : query.config.cacheTime
    )
  }

  query.refetch = async () => {
    try {
      await query.fetch()
    } catch (error) {
      Console.error(error)
    }
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

  query.setState = updater => query.dispatch({ type: actionSetState, updater })

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
    notifyGlobalListeners(query)
  }

  query.subscribe = (onStateUpdate = noop) => {
    const instance = makeQueryInstance(query, onStateUpdate)
    query.instances.push(instance)
    query.heal()
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
          // Resolve a
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

  query.fetch = async ({ fetchMore } = {}) => {
    let queryFn = query.config.queryFn

    if (!queryFn) {
      return
    }

    if (query.config.infinite) {
      const originalQueryFn = queryFn

      queryFn = async () => {
        const data = []
        const pageVariables = [...query.pageVariables]
        const rebuiltPageVariables = []

        do {
          const args = pageVariables.shift()

          if (!data.length) {
            // the first page query doesn't need to be rebuilt
            data.push(await originalQueryFn(...args))
            rebuiltPageVariables.push(args)
          } else {
            // get an up-to-date cursor based on the previous data set

            const nextCursor = query.config.getFetchMore(
              data[data.length - 1],
              data
            )

            // break early if there's no next cursor
            // otherwise we'll start from the beginning
            // which will cause unwanted duplication
            if (!nextCursor) {
              break
            }

            const pageArgs = [
              // remove the last argument (the previously saved cursor)
              ...args.slice(0, -1),
              nextCursor,
            ]

            data.push(await originalQueryFn(...pageArgs))
            rebuiltPageVariables.push(pageArgs)
          }
        } while (pageVariables.length)

        query.state.canFetchMore = query.config.getFetchMore(
          data[data.length - 1],
          data
        )
        query.pageVariables = rebuiltPageVariables

        return data
      }

      if (fetchMore) {
        queryFn = async (...args) => {
          const { fetchMoreInfo, previous } = fetchMore
          try {
            query.setState(old => ({
              ...old,
              isFetchingMore: previous ? 'previous' : 'next',
            }))

            const newArgs = [...args, fetchMoreInfo]

            query.pageVariables[previous ? 'unshift' : 'push'](newArgs)

            const newData = await originalQueryFn(...newArgs)

            const data = previous
              ? [newData, ...query.state.data]
              : [...query.state.data, newData]

            query.state.canFetchMore = query.config.getFetchMore(newData, data)

            return data
          } finally {
            query.setState(old => ({
              ...old,
              isFetchingMore: false,
            }))
          }
        }
      }
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

  if (query.config.infinite) {
    query.fetchMore = (
      fetchMoreInfo = query.state.canFetchMore,
      { previous = false } = {}
    ) => query.fetch({ fetchMore: { fetchMoreInfo, previous } })
  }

  return query
}

export function queryReducer(state, action) {
  const newState = switchActions(state, action)

  return Object.assign(newState, getStatusBools(newState.status))
}

function switchActions(state, action) {
  switch (action.type) {
    case actionInit:
      return {
        status: action.initialStatus,
        error: null,
        isFetching: action.initialStatus === 'loading',
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
