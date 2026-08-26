import type { DefaultError, WithRequired } from '@tanstack/query-core'

import type { UseMutationOptions } from './types'

/**
 * You can generally pass everything to `mutationOptions` that you can also pass to `useMutation`. A
 * `mutationKey` is required on this overload so the mutation can be looked up later, e.g. with
 * `useMutationState`.
 *
 * @see {@link useMutation} to run the mutation these options describe.
 * @param options - The mutation options to use, identical to what you'd pass to `useMutation`, with a
 * required `mutationKey`.
 * @returns The same options object, unchanged.
 *
 * @example
 * ```tsx
 * import { mutationOptions, useMutation } from '@tanstack/preact-query'
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
 * ```
 *
 * @example
 * Looking the mutation up elsewhere via its `mutationKey`, e.g. for a global "saving…" indicator:
 * ```tsx
 * import { mutationOptions, useMutationState } from '@tanstack/preact-query'
 *
 * const createPostOptions = mutationOptions({
 *   mutationKey: ['posts', 'create'],
 *   mutationFn: createPost,
 * })
 *
 * function SavingIndicator() {
 *   const isCreatingPost = useMutationState({
 *     filters: { mutationKey: createPostOptions.mutationKey, status: 'pending' },
 *   }).length > 0
 *
 *   return isCreatingPost ? <span>Saving…</span> : null
 * }
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
 * @see {@link useMutation} to run the mutation these options describe.
 * @param options - The mutation options to use, identical to what you'd pass to `useMutation`, without a
 * `mutationKey`.
 * @returns The same options object, unchanged.
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
