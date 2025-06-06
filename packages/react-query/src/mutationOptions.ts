import type { DefaultError, WithRequired } from '@tanstack/query-core'
import type { UseMutationOptions } from './types'

export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: WithRequired<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationKey'
  >,
): WithRequired<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  'mutationKey'
> {
  return options
}
