// Side effects
import './setBatchUpdatesFn'
import './setLogger'

export { EnvironmentProvider, useEnvironment } from './EnvironmentProvider'
export {
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary,
} from './QueryErrorResetBoundary'
export { useIsFetching } from './useIsFetching'
export { useMutation } from './useMutation'
export { useQuery } from './useQuery'
export { useQueries } from './useQueries'
export { useInfiniteQuery } from './useInfiniteQuery'

// Types
export * from './types'
export type { EnvironmentProviderProps } from './EnvironmentProvider'
export type { QueryErrorResetBoundaryProps } from './QueryErrorResetBoundary'
