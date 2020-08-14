import { MutationConfig } from '../core/types'
import { getDefaultedMutationConfig } from '../core/config'
import { useQueryCache } from './ReactQueryCacheProvider'
import { useContextConfig } from './ReactQueryConfigProvider'

export function useDefaultedMutationConfig<
  TResult,
  TError,
  TVariables,
  TSnapshot
>(
  config?: MutationConfig<TResult, TError, TVariables, TSnapshot>
): MutationConfig<TResult, TError, TVariables, TSnapshot> {
  const contextConfig = useContextConfig()
  const contextQueryCache = useQueryCache()
  const queryCache = config?.queryCache || contextQueryCache
  const queryCacheConfig = queryCache.getDefaultConfig()
  return getDefaultedMutationConfig(queryCacheConfig, contextConfig, config, {
    queryCache,
  })
}
