import { QueryConfig } from '../core/types'
import { getDefaultedQueryConfig } from '../core/config'
import { useQueryCache } from './ReactQueryCacheProvider'
import { useContextConfig } from './ReactQueryConfigProvider'

export function useDefaultedQueryConfig<TResult, TError>(
  config?: QueryConfig<TResult, TError>
): QueryConfig<TResult, TError> {
  const contextConfig = useContextConfig()
  const contextQueryCache = useQueryCache()
  const queryCache = config?.queryCache || contextQueryCache
  const queryCacheConfig = queryCache.getDefaultConfig()
  return getDefaultedQueryConfig(queryCacheConfig, contextConfig, config, {
    queryCache,
  })
}
