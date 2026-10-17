import type {
  DefaultError,
  MutationObserverOptions,
  OmitKeyof,
  WithRequired,
} from './types'

/**
 * Framework-agnostic options accepted by `mutationOptions`.
 */
export type CoreMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = OmitKeyof<
  MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
  '_defaulted'
>

/**
 * Defines reusable mutation options with type inference. Returns the original options unchanged.
 * @param options - The mutation options to reuse.
 * @returns The original options with inferred types.
 */
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

/**
 * Defines reusable mutation options and returns them unchanged.
 * @param options - The mutation options to reuse.
 * @returns The original options with inferred types.
 */
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: Omit<
    CoreMutationOptions<TData, TError, TVariables, TOnMutateResult>,
    'mutationKey'
  > & { mutationKey?: never },
): Omit<
  CoreMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  'mutationKey'
>

/**
 * Defines reusable mutation options and returns them unchanged.
 * @param options - The mutation options to reuse.
 * @returns The original options with inferred types.
 */
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: CoreMutationOptions<TData, TError, TVariables, TOnMutateResult>,
): CoreMutationOptions<TData, TError, TVariables, TOnMutateResult>

export function mutationOptions(options: unknown) {
  return options
}
