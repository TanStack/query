import type { DefaultError, WithRequired } from '@tanstack/query-core'
import type { CreateMutationOptions } from './types'

/**
 * You can generally pass everything to `mutationOptions` that you can also pass to `injectMutation`. A
 * `mutationKey` is required on this overload so the mutation can be looked up later, e.g. with
 * `injectMutationState`.
 *
 * @see {@link injectMutation} to run the mutation these options describe.
 * @param options - The mutation options to use, identical to what you'd pass to `injectMutation`, with a
 * required `mutationKey`.
 * @returns The same options object, unchanged.
 *
 * @example
 * Looking the mutation up elsewhere via its `mutationKey`, e.g. for a global "saving…" indicator:
 * ```angular-ts
 * import { mutationOptions, injectMutationState } from '@tanstack/angular-query-experimental'
 *
 * const createPostOptions = mutationOptions({
 *   mutationKey: ['posts', 'create'],
 *   mutationFn: createPost,
 * })
 *
 * @Component({
 *   selector: 'saving-indicator',
 *   template: `
 *     @if (isCreatingPost()) {
 *       <span>Saving…</span>
 *     }
 *   `,
 * })
 * export class SavingIndicator {
 *   readonly #pendingCreates = injectMutationState(() => ({
 *     filters: { mutationKey: createPostOptions.mutationKey, status: 'pending' },
 *   }))
 *   readonly isCreatingPost = computed(() => this.#pendingCreates().length > 0)
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
    CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
    'mutationKey'
  >,
): WithRequired<
  CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  'mutationKey'
>
/**
 * You can generally pass everything to `mutationOptions` that you can also pass to `injectMutation`. No
 * `mutationKey` is required on this overload — use this when you don't need to target the mutation via a
 * `mutationKey` filter later (e.g. with `injectMutationState`); it can still be observed through other
 * filters, such as `status`.
 *
 * @see {@link injectMutation} to run the mutation these options describe.
 * @param options - The mutation options to use, identical to what you'd pass to `injectMutation`, without a
 * `mutationKey`.
 * @returns The same options object, unchanged.
 * @remarks See the other overload's example for looking a mutation up via `injectMutationState`.
 *
 * @example
 * Sharing options across services, so `QueriesService` stays the single place a mutation is defined:
 * ```angular-ts
 * import { mutationOptions, injectMutation } from '@tanstack/angular-query-experimental'
 *
 * @Injectable({ providedIn: 'root' })
 * export class QueriesService {
 *   readonly #queryClient = inject(QueryClient)
 *
 *   updatePost(id: number) {
 *     return mutationOptions({
 *       mutationFn: (post: Partial<Post>) => putPost(id, post),
 *       onSuccess: (newPost) => this.#queryClient.setQueryData(['posts', id], newPost),
 *     })
 *   }
 * }
 *
 * @Component({
 *   selector: 'post',
 *   template: `<button (click)="save()">Save</button>`,
 * })
 * export class Post {
 *   readonly queries = inject(QueriesService)
 *   readonly id = signal(0)
 *   readonly updatePostMutation = injectMutation(() => this.queries.updatePost(this.id()))
 *
 *   save() {
 *     this.updatePostMutation.mutate({ title: 'New Title' })
 *   }
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
