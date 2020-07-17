import {
  isServer,
  getQueryArgs,
  deepIncludes,
  Console,
  isObject,
} from './utils'
import { defaultConfigRef } from './config'
import { makeQuery } from './query'

export const queryCache = makeQueryCache({ frozen: isServer })

export const queryCaches = [queryCache]

export function makeQueryCache({ frozen = false, defaultConfig } = {}) {
  // A frozen cache does not add new queries to the cache
  const globalListeners = []

  const configRef = defaultConfig
    ? { current: { ...defaultConfigRef.current, ...defaultConfig } }
    : defaultConfigRef

  const queryCache = {
    queries: {},
    isFetching: 0,
  }

  const notifyGlobalListeners = query => {
    queryCache.isFetching = Object.values(queryCache.queries).reduce(
      (acc, query) => (query.state.isFetching ? acc + 1 : acc),
      0
    )

    globalListeners.forEach(d => d(queryCache, query))
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
    { refetchActive = true, refetchInactive = false, exact, throwOnError } = {}
  ) => {
    try {
      return await Promise.all(
        queryCache.getQueries(predicate, { exact }).map(query => {
          if (query.instances.length) {
            if (
              refetchActive &&
              query.instances.some(instance => instance.config.enabled)
            ) {
              return query.fetch()
            }
          } else {
            if (refetchInactive) {
              return query.fetch()
            }
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
        notifyGlobalListeners,
      })

      if (config.infinite) {
        if (
          typeof query.state.canFetchMore === 'undefined' &&
          typeof query.state.data !== 'undefined'
        ) {
          query.state.canFetchMore = config.getFetchMore(
            query.state.data[query.state.data.length - 1],
            query.state.data
          )
        }

        // Here we seed the pageVariabes for the query
        if (!query.pageVariables) {
          query.pageVariables = [[...query.queryKey]]
        }
      }

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
      (args[1].hasOwnProperty('throwOnError') ||
        args[1].hasOwnProperty('force'))
    ) {
      args[3] = args[1]
      args[1] = undefined
      args[2] = undefined
    }

    let [queryKey, config, { force, throwOnError } = {}] = getQueryArgs(args)

    // https://github.com/tannerlinsley/react-query/issues/652
    config = { retry: false, ...config }

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
      Console.error(err)
    }
  }

  queryCache.setQueryData = (queryKey, updater, config = {}) => {
    let query = queryCache.getQuery(queryKey)

    if (!query) {
      query = queryCache.buildQuery(queryKey, config)
    }

    query.setData(updater)
  }

  return queryCache
}
