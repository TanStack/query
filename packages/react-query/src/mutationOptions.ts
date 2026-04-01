import type { OmitKeyof, WithRequired } from '@tanstack/query-core'
import type { UseMutationOptions } from './types'

export function mutationOptions<
  TData = unknown,
  TError = unknown,
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
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: OmitKeyof<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationKey'
  >,
): OmitKeyof<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  'mutationKey'
>
export function mutationOptions(options: unknown) {
  return options
}
