import type { RuntimeBinding } from '@tanstack/query-types/bindings'
import type { Mutation } from './mutation'
import type { MutationCache } from './mutationCache'
import type { MutationObserver } from './mutationObserver'
import type { Query } from './query'
import type { QueryCache } from './queryCache'
import type { QueryClient } from './queryClient'
import type { QueryObserver } from './queryObserver'
import type { RefetchInterval } from './refetchInterval'

/** Binds shared option and callback types to the concrete classes in this runtime. */
export interface QueryRuntime extends RuntimeBinding {
  /** Polling can be installed independently on each observed query. */
  refetchInterval:
    | false
    | RefetchInterval<this['Query']>
    | ((
        query: this['Query'],
      ) => false | undefined | RefetchInterval<this['Query']>)
  /** {@inheritDoc RuntimeBinding.QueryClient} */
  QueryClient: QueryClient
  /** {@inheritDoc RuntimeBinding.QueryCache} */
  QueryCache: QueryCache
  /** {@inheritDoc RuntimeBinding.MutationCache} */
  MutationCache: MutationCache
  /** {@inheritDoc RuntimeBinding.Query} */
  Query: Query<
    this['queryFnData'],
    this['error'],
    this['data'],
    this['queryKey'][0]
  >
  /** {@inheritDoc RuntimeBinding.Mutation} */
  Mutation: Mutation<
    this['data'],
    this['error'],
    this['variables'],
    this['onMutateResult']
  >
  /** {@inheritDoc RuntimeBinding.QueryObserver} */
  QueryObserver: QueryObserver<
    this['queryFnData'],
    this['error'],
    this['data'],
    this['queryData'],
    this['queryKey'][0]
  >
  /** {@inheritDoc RuntimeBinding.MutationObserver} */
  MutationObserver: MutationObserver<
    this['data'],
    this['error'],
    this['variables'],
    this['onMutateResult']
  >
}
