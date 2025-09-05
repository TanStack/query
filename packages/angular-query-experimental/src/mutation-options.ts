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
 *         this.queryClient.setQueryData(["posts", id], newPost);
 *       },
 *     });
 *   }
 * }
 *
 * queries = inject(QueriesService)
 * idSignal = new Signal(0);
 * mutation = injectMutation(() => this.queries.updatePost(this.idSignal()))
 *
 * mutation.mutate({ title: 'New Title' })
 * ```
 * @param options - The mutation options.
 * @returns Mutation options.
 */
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TScope = unknown,
>(
  options: WithRequired<
    CreateMutationOptions<TData, TError, TVariables, TScope>,
    'mutationKey'
  >,
): WithRequired<
  CreateMutationOptions<TData, TError, TVariables, TScope>,
  'mutationKey'
>
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TScope = unknown,
>(
  options: Omit<
    CreateMutationOptions<TData, TError, TVariables, TScope>,
    'mutationKey'
  >,
): Omit<CreateMutationOptions<TData, TError, TVariables, TScope>, 'mutationKey'>

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
 *         this.queryClient.setQueryData(["posts", id], newPost);
 *       },
 *     });
 *   }
 * }
 *
 * queries = inject(QueriesService)
 * idSignal = new Signal(0);
 * mutation = injectMutation(() => this.queries.updatePost(this.idSignal()))
 *
 * mutation.mutate({ title: 'New Title' })
 * ```
 * @param options - The mutation options.
 * @returns Mutation options.
 */
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TScope = unknown,
>(
  options: CreateMutationOptions<TData, TError, TVariables, TScope>,
): CreateMutationOptions<TData, TError, TVariables, TScope> {
  return options
}
