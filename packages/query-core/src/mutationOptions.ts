import type {
  DefaultError,
  MutationOptions,
  OmitKeyof,
  WithRequired,
} from './types'

/**
 * The {@link MutationOptions} that every framework adapter supports. Options that depend on a framework,
 * such as `throwOnError`, are left out. Use the `mutationOptions` helper of your adapter when you need them.
 * @template TData - The type your `mutationFn` resolves to.
 * @template TError - The type of errors your `mutationFn` may throw.
 * @template TVariables - The type of the variables passed to `mutate`.
 * @template TOnMutateResult - The type `onMutate` returns.
 */
export type CoreMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = OmitKeyof<
  MutationOptions<TData, TError, TVariables, TOnMutateResult>,
  '_defaulted'
>

/**
 * Defines mutation options that can be shared between framework adapters and imperative APIs such as
 * `MutationObserver`. At runtime, it returns the options unchanged.
 *
 * Only {@link CoreMutationOptions} are accepted. Use the `mutationOptions` helper of your adapter for
 * framework-specific options such as `throwOnError`.
 * @param options - The mutation options to use, with a `mutationKey`.
 * @returns The same options object, with inferred types.
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
 * Defines mutation options that can be shared between framework adapters and imperative APIs such as
 * `MutationObserver`. At runtime, it returns the options unchanged.
 *
 * Only {@link CoreMutationOptions} are accepted. Use the `mutationOptions` helper of your adapter for
 * framework-specific options such as `throwOnError`.
 * @param options - The mutation options to use, without a `mutationKey`.
 * @returns The same options object, with inferred types.
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
 * Defines mutation options that can be shared between framework adapters and imperative APIs such as
 * `MutationObserver`. At runtime, it returns the options unchanged.
 *
 * Only {@link CoreMutationOptions} are accepted. Use the `mutationOptions` helper of your adapter for
 * framework-specific options such as `throwOnError`.
 * @param options - The mutation options to use, with an optional `mutationKey`.
 * @returns The same options object, with inferred types.
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
