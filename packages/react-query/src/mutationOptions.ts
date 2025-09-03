import type { DefaultError, WithRequired } from '@tanstack/query-core'
import type { UseMutationOptions } from './types'

export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TScope = unknown,
>(
  options: WithRequired<
    UseMutationOptions<TData, TError, TVariables, TScope>,
    'mutationKey'
  >,
): WithRequired<
  UseMutationOptions<TData, TError, TVariables, TScope>,
  'mutationKey'
>
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TScope = unknown,
>(
  options: Omit<
    UseMutationOptions<TData, TError, TVariables, TScope>,
    'mutationKey'
  >,
): Omit<UseMutationOptions<TData, TError, TVariables, TScope>, 'mutationKey'>
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TScope = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TScope>,
): UseMutationOptions<TData, TError, TVariables, TScope> {
  return options
}
