import {
  isServer,
  functionalUpdate,
  cancelledError,
  isDocumentVisible,
  statusLoading,
  statusSuccess,
  statusError,
  noop,
} from './utils'
import { defaultConfigRef } from './config'

export const actionInit = {}
export const actionActivate = {}
export const actionDeactivate = {}
export const actionFailed = {}
export const actionMarkStale = {}
export const actionFetch = {}
export const actionSuccess = {}
export const actionError = {}
export const actionSetData = {}

export const queryCacheRef = { current: queryCache() }
export const getQueryCache = () => queryCacheRef.current

export function queryCache() {
  let cache = {}
  let listeners = []

  const getByKey = queryKey => {
    const [queryHash] = defaultConfigRef.current.queryKeySerializerFn(queryKey)
    return cache[queryHash]
  }

  const clear = () => (cache = {})

  const tick = () => {
    listeners.forEach(d => d())
  }

  const build = ({ queryKey, config, queryFn }) => {
    const [
      queryHash,
      queryGroup,
      variablesHash,
      variables,
    ] = config.queryKeySerializerFn(queryKey)

    let query = cache[queryKey]

    if (!query) {
      let initialData = config.paginated ? [] : undefined

      if (typeof config.initialData !== 'undefined') {
        initialData = config.initialData
      }

      query = {
        queryHash,
        queryGroup,
        variablesHash,
        variables,
        config,
        queryFn,
        pageVariables: [],
        instances: [],
        state: queryReducer(undefined, {
          type: actionInit,
          initialData,
          manual: config.manual,
        }),
        // promise: null,
        // staleTimeout: null,
        // cacheTimeout: null,
        // cancelled: null,
      }

      query.dispatch = action => {
        query.state = queryReducer(query.state, action)
        query.instances.forEach(d => d.onStateUpdate(query.state))
        tick()
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
                delete cache[queryHash]
                tick()
              },
              query.state.status === 'success' ? query.config.cacheTime : 0
            )
          }
        }
      }

      // Set up the fetch function
      const tryFetchQueryPages = async pageVariables => {
        try {
          // Perform the query
          const promises = pageVariables.map(variables =>
            query.queryFn(variables)
          )

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
        variables = query.config.paginated && query.state.status === 'success' // TODO: WHAT?
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
                query.config.paginated &&
                query.state.status === 'success' &&
                !isFetchMore
                  ? variables
                  : [variables]

              // Try to fetch
              let data = await tryFetchQueryPages(variables)

              // If we are paginating, and this is the first query or a fetch more
              // query, then store the variables in the pageVariables
              if (
                query.config.paginated &&
                (isFetchMore || !query.state.status === 'success')
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

      query.setData = updater =>
        query.dispatch({ type: actionSetData, updater })
    }

    if (!isServer) {
      cache[queryHash] = query
    }

    return query
  }

  return {
    cache,
    build,
    getByKey,
    clear,
  }
}

export function queryReducer(state, action) {
  switch (action.type) {
    case actionInit:
      return {
        status: action.manual ? statusSuccess : statusLoading,
        error: null,
        isFetching: action.manual ? false : true,
        isFetchingMore: false,
        canFetchMore: false,
        failureCount: 0,
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
