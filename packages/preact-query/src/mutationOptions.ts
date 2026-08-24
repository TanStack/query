import type { DefaultError, WithRequired } from '@tanstack/query-core'

import type { UseMutationOptions } from './types'

/**
 * You can generally pass everything to `mutationOptions` that you can also pass to `useMutation`. A
 * `mutationKey` is required on this overload so the mutation can be looked up later, e.g. with
 * `useMutationState`.
 *
 * @example
 * ```tsx
 * import { mutationOptions, useMutation, useMutationState } from '@tanstack/preact-query'
 *
 * export const createPostOptions = mutationOptions({
 *   mutationKey: ['posts', 'create'],
 *   mutationFn: createPost,
 * })
 *
 * function CreatePost() {
 *   const mutation = useMutation(createPostOptions)
 *   return <button onClick={() => mutation.mutate({ title: 'Hello' })}>Create</button>
 * }
 *
 * // Elsewhere, e.g. to show a global "saving…" indicator:
 * const isCreatingPost = useMutationState({
 *   filters: { mutationKey: createPostOptions.mutationKey, status: 'pending' },
 * }).length > 0
 * ```
 */
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: WithRequired<
    UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
    'mutationKey'
  >,
): WithRequired<
  UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  'mutationKey'
>
/**
 * You can generally pass everything to `mutationOptions` that you can also pass to `useMutation`. No
 * `mutationKey` is required on this overload — use this when you don't need to look the mutation up later
 * (e.g. with `useMutationState`).
 *
 * @example
 * ```tsx
 * import { mutationOptions, useMutation } from '@tanstack/preact-query'
 *
 * export const createPostOptions = mutationOptions({
 *   mutationFn: createPost,
 * })
 *
 * function CreatePost() {
 *   const mutation = useMutation(createPostOptions)
 *   return <button onClick={() => mutation.mutate({ title: 'Hello' })}>Create</button>
 * }
 * ```
 */
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: Omit<
    UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
    'mutationKey'
  >,
): Omit<
  UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  'mutationKey'
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
