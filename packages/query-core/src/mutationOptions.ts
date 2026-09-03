import type {
  DefaultError,
  MutationObserverOptions,
  OmitKeyof,
  WithRequired,
} from './types'

export type CoreMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = OmitKeyof<
  MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
  '_defaulted'
>

export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: WithRequired<
    CoreMutationOptions<TData, TError, TVariables, TOnMutateResult>,
    'mutationKey'
  >,
): WithRequired<
  CoreMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  'mutationKey'
>

export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: Omit<
    CoreMutationOptions<TData, TError, TVariables, TOnMutateResult>,
    'mutationKey'
  >,
): Omit<
  CoreMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  'mutationKey'
>

export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: CoreMutationOptions<TData, TError, TVariables, TOnMutateResult>,
): CoreMutationOptions<TData, TError, TVariables, TOnMutateResult> {
  return options
}
