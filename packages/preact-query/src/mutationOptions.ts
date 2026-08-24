import type { DefaultError, WithRequired } from '@tanstack/query-core'

import type { UseMutationOptions } from './types'

/**
 * You can generally pass everything to `mutationOptions` that you can also pass to `useMutation`.
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
 * You can generally pass everything to `mutationOptions` that you can also pass to `useMutation`.
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
