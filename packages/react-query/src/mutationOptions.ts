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
>
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationKey'
  >,
): Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationKey'>
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationOptions<TData, TError, TVariables, TContext> {
  return options
}
