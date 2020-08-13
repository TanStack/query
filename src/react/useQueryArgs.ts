import { getQueryArgs } from '../core/utils'
import { useConfigContext } from './ReactQueryConfigProvider'
import { QueryConfig, QueryKey } from '../core/types'
import { useQueryCache } from './ReactQueryCacheProvider'

export function useQueryArgs<TResult, TError, TOptions = undefined>(
  args: any[]
): [QueryKey, QueryConfig<TResult, TError>, TOptions] {
  const queryCache = useQueryCache()

  const configContext = useConfigContext()

  const [queryKey, config, options] = getQueryArgs<TResult, TError, TOptions>(
    args
  )

  // Build the final config
  const resolvedConfig = {
    ...configContext.shared,
    ...configContext.queries,
    queryCache,
    ...config,
  } as QueryConfig<TResult, TError>

  return [queryKey, resolvedConfig, options]
}
