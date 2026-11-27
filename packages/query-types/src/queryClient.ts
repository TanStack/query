import type { RuntimeBinding } from './binding'
import type { skipToken } from './symbols'
import type {
  MutationKey,
  MutationOptions,
  OmitKeyof,
  QueryKey,
  QueryOptions,
} from './types'

export type WithoutSkipToken<T extends { queryFn?: unknown }> = Omit<
  T,
  'queryFn'
> & {
  queryFn?: Exclude<T['queryFn'], typeof skipToken>
}

export interface QueryDefaults<TRuntime extends RuntimeBinding> {
  queryKey: QueryKey
  defaultOptions: OmitKeyof<QueryOptions<TRuntime, any, any, any>, 'queryKey'>
}

export interface MutationDefaults<TRuntime extends RuntimeBinding> {
  mutationKey: MutationKey
  defaultOptions: MutationOptions<TRuntime, any, any, any, any>
}
