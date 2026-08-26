---
id: renderResult
title: renderResult
---

```ts
function renderResult<TResult, TRenderers>(result, renderers): RendererResult<TResult, TRenderers>;
```

Defined in: [packages/lit-query/src/render.ts:44](https://github.com/TanStack/query/blob/main/packages/lit-query/src/render.ts#L44)

Based on the `status` property of the given `result`, renders the appropriate content using the provided `renderers`. If no renderer is found for the
current status, renders nothing.

This function is useful for rendering the state of a query result, such as loading, error, or success states, in a declarative way.

## Type Parameters

### TResult

`TResult` *extends* `object`

### TRenderers

`TRenderers` *extends* [`ResultRenderers`](../type-aliases/ResultRenderers.md)\<`TResult`\>

## Parameters

### result

`TResult`

The result object containing a `status` property that indicates the current state of the query.

### renderers

`TRenderers`

An object mapping possible `status` values to their corresponding rendering functions. Each function receives the result object as an argument and returns the content to be rendered for that status.

## Returns

[`RendererResult`](../type-aliases/RendererResult.md)\<`TResult`, `TRenderers`\>

The content returned by the appropriate renderer based on the `status` of the result, or nothing if no renderer is found for that status.

## Example

```ts
class TodosView extends LitElement {
  private readonly todos = createQueryController(this, {
    queryKey: ['todos'],
    queryFn: async () => fetch('/api/todos').then((r) => r.json()),
  })

  render() {
    const query = this.todos()
    return renderResult(query, {
      pending: () => html`Loading...`,
      error: ({ error }) => html`Error: ${error.message}`,
      success: ({ data }) => html`<ul>${data.map((todo) => html`<li>${todo.title}</li>`)}</ul>`,
    })
  }
}
```
