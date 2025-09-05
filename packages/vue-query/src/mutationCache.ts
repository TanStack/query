import { MutationCache as MC } from '@tanstack/query-core'
import { cloneDeepUnref } from './utils'
import type {
  DefaultError,
  Mutation,
  MutationFilters,
} from '@tanstack/query-core'
import type { MaybeRefDeep } from './types'

export class MutationCache extends MC {
  find<
    TData = unknown,
    TError = DefaultError,
    TVariables = any,
    TScope = unknown,
  >(
    filters: MaybeRefDeep<MutationFilters>,
  ): Mutation<TData, TError, TVariables, TScope> | undefined {
    return super.find(cloneDeepUnref(filters))
  }

  findAll(filters: MaybeRefDeep<MutationFilters> = {}): Array<Mutation> {
    return super.findAll(cloneDeepUnref(filters))
  }
}
