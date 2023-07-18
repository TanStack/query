import { MutationCache as MC } from '@tanstack/query-core'
import { cloneDeepUnref } from './utils'
import type { Mutation, MutationFilters } from '@tanstack/query-core'
import type { MaybeRefDeep } from './types'

export class MutationCache extends MC {
  find<TData = unknown, TError = unknown, TVariables = any, TContext = unknown>(
    filters: MaybeRefDeep<MutationFilters>,
  ): Mutation<TData, TError, TVariables, TContext> | undefined {
    return super.find(cloneDeepUnref(filters) as MutationFilters)
  }

  findAll(filters: MaybeRefDeep<MutationFilters>): Mutation[] {
    return super.findAll(cloneDeepUnref(filters) as MutationFilters)
  }
}
