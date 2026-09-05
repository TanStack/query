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
 * ```vue
 * <script setup lang="ts">
 * import { mutationOptions, useMutationState } from '@tanstack/vue-query'
 * import { computed } from 'vue'
 *
 * const createPostOptions = mutationOptions({
 *   mutationKey: ['posts', 'create'],
 *   mutationFn: createPost,
 * })
 *
 * // Call `useMutationState` once — it manages its own subscription — then derive from its result.
 * const creatingPosts = useMutationState({
 *   filters: { mutationKey: createPostOptions.mutationKey, status: 'pending' },
 * })
 * const isCreatingPost = computed(() => creatingPosts.value.length > 0)
 * </script>
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
 * Same as the plain-object overload with a required `mutationKey`, but for options that close over reactive
 * state (`ref`s read inside the function body). Wrap them in a getter so `useMutation` and the other consumers
 * always read the current values instead of the ones captured when the options were created.
 *
 * @see {@link useMutation} to run the mutation these options describe.
 * @param options - A function returning the mutation options to use, with a required `mutationKey`,
 * re-evaluated on demand.
 * @returns A function that returns the same options object, unchanged.
 */
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: () => WithRequired<
    MutationOptions<TData, TError, TVariables, TOnMutateResult>,
    'mutationKey'
  >,
): () => WithRequired<
  MutationOptions<TData, TError, TVariables, TOnMutateResult>,
  'mutationKey'
>

/**
 * You can generally pass everything to `mutationOptions` that you can also pass to `useMutation`. No
 * `mutationKey` is required on this overload — use this when you don't need to target the mutation via a
 * `mutationKey` filter later (e.g. with `useMutationState`); it can still be observed through other filters,
 * such as `status`.
 *
 * @see {@link useMutation} to run the mutation these options describe.
 * @param options - The mutation options to use, identical to what you'd pass to `useMutation`, without a
 * `mutationKey`.
 * @returns The same options object, unchanged.
 * @remarks See the other overload's example for looking a mutation up via `useMutationState`.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { mutationOptions, useMutation } from '@tanstack/vue-query'
 *
 * const createPostOptions = mutationOptions({
 *   mutationFn: createPost,
 * })
 *
 * const mutation = useMutation(createPostOptions)
 * </script>
 *
 * <template>
 *   <button @click="mutation.mutate({ title: 'Hello' })">Create</button>
 * </template>
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

/**
 * Same as the plain-object overload without a `mutationKey`, but for options that close over reactive state
 * (`ref`s read inside the function body). Wrap them in a getter so `useMutation` and the other consumers
 * always read the current values instead of the ones captured when the options were created.
 *
 * @see {@link useMutation} to run the mutation these options describe.
 * @param options - A function returning the mutation options to use, without a `mutationKey`, re-evaluated on
 * demand.
 * @returns A function that returns the same options object, unchanged.
 */
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: () => Omit<
    MutationOptions<TData, TError, TVariables, TOnMutateResult>,
    'mutationKey'
  >,
): () => Omit<
  MutationOptions<TData, TError, TVariables, TOnMutateResult>,
  'mutationKey'
>
export function mutationOptions(options: unknown) {
  return options
}
