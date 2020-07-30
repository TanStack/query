import { getQueryArgs } from '../core/utils'
import { useConfigContext } from './ReactQueryConfigProvider'
import { QueryConfig, QueryKey } from '../core/types'

export function useQueryArgs<TResult, TError, TOptions = undefined>(
  args: any[]
): [QueryKey, QueryConfig<TResult, TError>, TOptions] {
  const configContext = useConfigContext()

  const [queryKey, config, options] = getQueryArgs<TResult, TError, TOptions>(
    args
  )

  // Build the final config
  const configWithContext = {
    ...configContext.shared,
    ...configContext.queries,
    ...config,
  } as QueryConfig<TResult, TError>

  return [queryKey, configWithContext, options]
}
