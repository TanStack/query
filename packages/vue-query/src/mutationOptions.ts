import type { UseMutationOptions } from './useMutation';
import type { DefaultError, WithRequired } from '@tanstack/query-core'
import type { DeepUnwrapRefOrGetter, MaybeRefDeepOrGetter } from './types'

export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: MaybeRefDeepOrGetter<
    WithRequired<
      DeepUnwrapRefOrGetter<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>>,
      'mutationKey'
    >
  >,
): MaybeRefDeepOrGetter<
  WithRequired<
    DeepUnwrapRefOrGetter<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>>,
    'mutationKey'
  >
>
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: MaybeRefDeepOrGetter<
    Omit<
      DeepUnwrapRefOrGetter<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>>,
      'mutationKey'
    >
  >,
): MaybeRefDeepOrGetter<
  Omit<
    DeepUnwrapRefOrGetter<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>>,
    'mutationKey'
  >
>
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
): UseMutationOptions<TData, TError, TVariables, TOnMutateResult> {
  return options
}
