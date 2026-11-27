import type { RuntimeBinding } from '@tanstack/query-types/bindings'
import type { Mutation } from './mutation'
import type { MutationCache } from './mutationCache'
import type { MutationObserver } from './mutationObserver'
import type { Query } from './query'
import type { QueryCache } from './queryCache'
import type { QueryClient } from './queryClient'
import type { QueryObserver } from './queryObserver'

/** Binds shared option and callback types to the concrete classes in this runtime. */
interface QueryRuntime extends RuntimeBinding {
  QueryClient: QueryClient
  QueryCache: QueryCache
  MutationCache: MutationCache
  Query: Query<
    this['queryFnData'],
    this['error'],
    this['data'],
    this['queryKey'][0]
  >
  Mutation: Mutation<
    this['data'],
    this['error'],
    this['variables'],
    this['onMutateResult']
  >
  QueryObserver: QueryObserver<
    this['queryFnData'],
    this['error'],
    this['data'],
    this['queryData'],
    this['queryKey'][0]
  >
  MutationObserver: MutationObserver<
    this['data'],
    this['error'],
    this['variables'],
    this['onMutateResult']
  >
}

export type { QueryRuntime }
