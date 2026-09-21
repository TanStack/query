import { MutationCache as MC } from '@tanstack/query-core'
import { cloneDeepUnref } from './utils'
import type {
  DefaultError,
  Mutation,
  MutationFilters,
} from '@tanstack/query-core'
import type { MaybeRefDeep } from './types'

/**
 * Vue-aware subclass of `@tanstack/query-core`'s `MutationCache`. `find`/`findAll` also accept a
 * {@link MaybeRefDeep} filters object, so `ref`s can be passed directly without unwrapping. Access it via
 * `queryClient.getMutationCache()` — `QueryClient` constructs one of these by default.
 */
export class MutationCache extends MC {
  find<
    TData = unknown,
    TError = DefaultError,
    TVariables = any,
    TOnMutateResult = unknown,
  >(
    filters: MaybeRefDeep<MutationFilters>,
  ): Mutation<TData, TError, TVariables, TOnMutateResult> | undefined {
    return super.find(cloneDeepUnref(filters))
  }

  findAll(filters: MaybeRefDeep<MutationFilters> = {}): Array<Mutation> {
    return super.findAll(cloneDeepUnref(filters))
  }
}
