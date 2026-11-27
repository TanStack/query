import {
  cancelQueries,
  getQueriesData,
  invalidateQueries,
  refetchQueries,
  removeQueries,
  resetQueries,
  setQueriesData,
} from '../src/runtime/cacheOperations'
import { bindInfiniteQuery } from './compat-infiniteQuery'
import type { QueryClient } from '../src/runtime/queryClient'

export function cacheOperations<TClient extends QueryClient>(client: TClient) {
  function bind<TArgs extends Array<unknown>, TResult>(
    operation: (client: QueryClient, ...args: TArgs) => TResult,
  ) {
    return (...args: TArgs) => operation(client, ...args)
  }

  return {
    infiniteQuery: bindInfiniteQuery(client),
    getQueriesData: bind(getQueriesData),
    setQueriesData: bind(setQueriesData),
    removeQueries: bind(removeQueries),
    resetQueries: bind(resetQueries),
    cancelQueries: bind(cancelQueries),
    invalidateQueries: bind(invalidateQueries),
    refetchQueries: bind(refetchQueries),
  }
}

export { getMutationCache } from '../src'
