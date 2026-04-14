import type {
  DefaultError,
  MutationObserverOptions,
} from '@tanstack/query-core'

export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
): MutationObserverOptions<TData, TError, TVariables, TOnMutateResult> {
  return options
}
