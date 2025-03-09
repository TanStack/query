import type {
  DefaultError,
  MutationObserverOptions,
  OmitKeyof,
} from '@tanstack/query-core'

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
 * @public
 */
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: MutationObserverOptions<TData, TError, TVariables, TContext>,
): CreateMutationOptions<TData, TError, TVariables, TContext> {
  return options
}

/**
 * @public
 */
export interface CreateMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> extends OmitKeyof<
    MutationObserverOptions<TData, TError, TVariables, TContext>,
    '_defaulted'
  > {}
