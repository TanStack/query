import type { DefaultError, WithRequired } from '@tanstack/query-core'
import type { CreateMutationOptions } from './types.js'

/**
 * You can generally pass everything to `mutationOptions` that you can also pass to `createMutation`. This
 * overload requires `mutationKey`, so the resulting options can be looked up elsewhere (e.g. with
 * `useMutationState`).
 *
 * @see {@link createMutation} to run a mutation with these options.
 * @param options - The options to use — everything you can pass to `createMutation`, with `mutationKey` set.
 * @returns The same options object.
 *
 * @example
 * Looking the mutation up elsewhere via its `mutationKey`, e.g. for a global "saving…" indicator:
 * ```svelte
 * <script lang="ts">
 *   import { mutationOptions, useMutationState } from '@tanstack/svelte-query'
 *
 *   const createPostOptions = mutationOptions({
 *     mutationKey: ['posts', 'create'],
 *     mutationFn: createPost,
 *   })
 *
 *   const pending = useMutationState({
 *     filters: { mutationKey: createPostOptions.mutationKey, status: 'pending' },
 *   })
 * </script>
 *
 * {#if pending.length > 0}
 *   <span>Saving…</span>
 * {/if}
 * ```
 */
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: WithRequired<
    CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
    'mutationKey'
  >,
): WithRequired<
  CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  'mutationKey'
>

/**
 * You can generally pass everything to `mutationOptions` that you can also pass to `createMutation`.
 *
 * @see {@link createMutation} to run a mutation with these options.
 * @param options - The options to use — everything you can pass to `createMutation`.
 * @returns The same options object.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { mutationOptions, createMutation } from '@tanstack/svelte-query'
 *
 *   const createPostOptions = mutationOptions({
 *     mutationFn: createPost,
 *   })
 *
 *   const mutation = createMutation(() => createPostOptions)
 * </script>
 *
 * <button onclick={() => mutation.mutate({ title: 'Hello' })}>Create</button>
 * ```
 */
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: Omit<
    CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
    'mutationKey'
  >,
): Omit<
  CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  'mutationKey'
>
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
): CreateMutationOptions<TData, TError, TVariables, TOnMutateResult> {
  return options
}
