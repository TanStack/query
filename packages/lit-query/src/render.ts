export type ResultRenderers<TResult extends { status: string }> = {
  [K in TResult['status']]?: (
    result: Extract<TResult, { status: K }>,
  ) => unknown
}

export type RendererResult<
  TResult extends { status: string },
  TRenderers extends ResultRenderers<TResult>,
> = {
  [K in TResult['status']]: TRenderers[K] extends (
    result: Extract<TResult, { status: K }>,
  ) => infer R
    ? R
    : undefined
}[TResult['status']]

/**
 * Based on the `status` property of the given `result`, renders the appropriate content using the provided `renderers`. If no renderer is found for the
 * current status, renders nothing.
 *
 * This function is useful for rendering the state of a query result, such as loading, error, or success states, in a declarative way.
 * @param result - The result object containing a `status` property that indicates the current state of the query.
 * @param renderers - An object mapping possible `status` values to their corresponding rendering functions. Each function receives the result object as an argument and returns the content to be rendered for that status.
 * @returns The content returned by the appropriate renderer based on the `status` of the result, or nothing if no renderer is found for that status.
 *
 * @example
 * class TodosView extends LitElement {
 *   private readonly todos = createQueryController(this, {
 *     queryKey: ['todos'],
 *     queryFn: async () => fetch('/api/todos').then((r) => r.json()),
 *   })
 *
 *   render() {
 *     const query = this.todos()
 *     return renderResult(query, {
 *       pending: () => html`Loading...`,
 *       error: ({ error }) => html`Error: ${error.message}`,
 *       success: ({ data }) => html`<ul>${data.map((todo) => html`<li>${todo.title}</li>`)}</ul>`,
 *     })
 *   }
 * }
 */
export function renderResult<
  TResult extends { status: string },
  TRenderers extends ResultRenderers<TResult>,
>(result: TResult, renderers: TRenderers): RendererResult<TResult, TRenderers> {
  return renderers[result.status as TResult['status']]?.(result as never) as any
}
