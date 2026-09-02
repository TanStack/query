import type { DefaultError, WithRequired } from '@tanstack/query-core'
import type { MutationOptions } from './types'

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
 * Looking the mutation up elsewhere via its `mutationKey`, e.g. for a global "saving…" indicator:
 * ```tsx
 * import { mutationOptions, useMutationState } from '@tanstack/solid-query'
 *
 * const createPostOptions = mutationOptions({
 *   mutationKey: ['posts', 'create'],
 *   mutationFn: createPost,
 * })
 *
 * function SavingIndicator() {
 *   const isCreatingPost = useMutationState(() => ({
 *     filters: { mutationKey: createPostOptions.mutationKey, status: 'pending' },
 *   }))
 *
 *   return isCreatingPost().length > 0 ? <span>Saving…</span> : null
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
    MutationOptions<TData, TError, TVariables, TOnMutateResult>,
    'mutationKey'
  >,
): WithRequired<
  MutationOptions<TData, TError, TVariables, TOnMutateResult>,
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
 * @remarks Without a `mutationKey`, the mutation can't be targeted via a `mutationKey` filter in
 * `useMutationState` — it can still be observed through other filters, such as `status` — see the other
 * overload's example for that.
 *
 * @example
 * ```tsx
 * import { mutationOptions, useMutation } from '@tanstack/solid-query'
 *
 * const createPostOptions = mutationOptions({
 *   mutationFn: createPost,
 * })
 *
 * function CreatePost() {
 *   const createPostMutation = useMutation(() => createPostOptions)
 *   return <button onClick={() => createPostMutation.mutate({ title: 'Hello' })}>Create</button>
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
    MutationOptions<TData, TError, TVariables, TOnMutateResult>,
    'mutationKey'
  >,
): Omit<
  MutationOptions<TData, TError, TVariables, TOnMutateResult>,
  'mutationKey'
>
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: MutationOptions<TData, TError, TVariables, TOnMutateResult>,
): MutationOptions<TData, TError, TVariables, TOnMutateResult> {
  return options
}
