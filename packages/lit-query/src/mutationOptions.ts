import type {
  DefaultError,
  MutationObserverOptions,
} from '@tanstack/query-core'

/**
 * Preserves and types mutation options for reuse across Lit Query APIs.
 *
 * @param options - Mutation options to preserve.
 * @returns The same options object.
 *
 * @example
 * ```ts
 * import { mutationOptions } from '@tanstack/lit-query'
 *
 * const addTodoOptions = mutationOptions({
 *   mutationKey: ['add-todo'],
 *   mutationFn: (title: string) => addTodo(title),
 * })
 * ```
 */
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
