import type { DefaultError, MutationObserverOptions, WithRequired } from '@tanstack/query-core'
import type { UseMutationOptions } from './useMutation'
import type { MaybeRefDeep, ShallowOption } from './types'

type UseMutationOptionsBase<TData, TError, TVariables, TOnMutateResult> =
  MutationObserverOptions<TData, TError, TVariables, TOnMutateResult> &
    ShallowOption

type MutationOptionsWithMutationKeyRequired<TData, TError, TVariables, TOnMutateResult> =
  | MaybeRefDeep<
      WithRequired<
        UseMutationOptionsBase<TData, TError, TVariables, TOnMutateResult>,
        'mutationKey'
      >
    >
  | (() => MaybeRefDeep<
      WithRequired<
        UseMutationOptionsBase<TData, TError, TVariables, TOnMutateResult>,
        'mutationKey'
      >
    >)

type MutationOptionsWithMutationKeyOmit<TData, TError, TVariables, TOnMutateResult> =
  | MaybeRefDeep<
      Omit<
        UseMutationOptionsBase<TData, TError, TVariables, TOnMutateResult>,
        'mutationKey'
      >
    >
  | (() => MaybeRefDeep<
      Omit<
        UseMutationOptionsBase<TData, TError, TVariables, TOnMutateResult>,
        'mutationKey'
      >
    >)


export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: MutationOptionsWithMutationKeyRequired<TData, TError, TVariables, TOnMutateResult>,
): MutationOptionsWithMutationKeyRequired<TData, TError, TVariables, TOnMutateResult>
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: MutationOptionsWithMutationKeyOmit<TData, TError, TVariables, TOnMutateResult>,
): MutationOptionsWithMutationKeyOmit<TData, TError, TVariables, TOnMutateResult>
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
