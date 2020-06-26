import { getQueryArgs } from '../core/utils'
import { useConfigContext } from './ReactQueryConfigProvider'

export function useQueryArgs(args) {
  const configContext = useConfigContext()

  let [queryKey, config, ...rest] = getQueryArgs(args)

  // Build the final config
  config = {
    ...configContext.shared,
    ...configContext.queries,
    ...config,
  }

  return [queryKey, config, ...rest]
}
