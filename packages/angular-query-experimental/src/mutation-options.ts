import type { DefaultError, WithRequired } from '@tanstack/query-core'
import type { CreateMutationOptions } from './types'

/**
 * Allows to share and re-use mutation options in a type-safe way.
 *
 * **Example**
 *
 * ```ts
 * export class QueriesService {
 *   private http = inject(HttpClient);
 *
 *   updatePost(id: number) {
 *     return mutationOptions({
 *       mutationFn: (post: Post) => Promise.resolve(post),
 *       mutationKey: ["updatePost", id],
 *       onSuccess: (newPost) => {
 *         //           ^? newPost: Post
 *         this.queryClient.setQueryData(["posts", id], newPost)
 *       },
 *     });
 *   }
 * }
 *
 * class ComponentOrService {
 *   queries = inject(QueriesService)
 *   id = signal(0)
 *   mutation = injectMutation(() => this.queries.updatePost(this.id()))
 *
 *   save() {
 *     this.mutation.mutate({ title: 'New Title' })
 *   }
 * }
 * ```
 * @param options - The mutation options.
 * @returns Mutation options.
 */
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: WithRequired<
    CreateMutationOptions<TData, TError, TVariables, TContext>,
    'mutationKey'
  >,
): WithRequired<
  CreateMutationOptions<TData, TError, TVariables, TContext>,
  'mutationKey'
>
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: Omit<
    CreateMutationOptions<TData, TError, TVariables, TContext>,
    'mutationKey'
  >,
): Omit<
  CreateMutationOptions<TData, TError, TVariables, TContext>,
  'mutationKey'
>

/**
 * Allows to share and re-use mutation options in a type-safe way.
 *
 * **Example**
 *
 * ```ts
 * export class QueriesService {
 *   private http = inject(HttpClient);
 *
 *   updatePost(id: number) {
 *     return mutationOptions({
 *       mutationFn: (post: Post) => Promise.resolve(post),
 *       mutationKey: ["updatePost", id],
 *       onSuccess: (newPost) => {
 *         //           ^? newPost: Post
 *         this.queryClient.setQueryData(["posts", id], newPost)
 *       },
 *     });
 *   }
 * }
 *
 * class ComponentOrService {
 *   queries = inject(QueriesService)
 *   id = signal(0)
 *   mutation = injectMutation(() => this.queries.updatePost(this.id()))
 *
 *   save() {
 *     this.mutation.mutate({ title: 'New Title' })
 *   }
 * }
 * ```
 * @param options - The mutation options.
 * @returns Mutation options.
 */
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: CreateMutationOptions<TData, TError, TVariables, TContext>,
): CreateMutationOptions<TData, TError, TVariables, TContext> {
  return options
}
