---
id: createMutationController
title: createMutationController
---

# Function: createMutationController()

```ts
function createMutationController<TData, TError, TVariables, TOnMutateResult>(
   host,
   options,
queryClient?): MutationResultAccessor<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/lit-query/src/createMutationController.ts:338](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createMutationController.ts#L338)

Creates a Lit reactive controller that subscribes the host to a mutation.

The returned accessor is callable and also exposes `current`, `mutate`,
`mutateAsync`, `reset`, and `destroy`. When `options` is a function, it is
re-read during host updates so mutation options can follow reactive host
state.

If `queryClient` is omitted, the controller resolves the client from the
nearest connected `QueryClientProvider`.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `Error`

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Parameters

### host

`ReactiveControllerHost`

The Lit reactive controller host that owns the mutation
subscription.

### options

[`Accessor`](../type-aliases/Accessor.md)\<[`CreateMutationOptions`](../type-aliases/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>\>

Mutation observer options, or a getter that returns options.

### queryClient?

`QueryClient`

Optional explicit query client. Provide this for
controllers that should not resolve a client from Lit context.

## Returns

[`MutationResultAccessor`](../type-aliases/MutationResultAccessor.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

An accessor for the latest mutation result with mutation helper
methods.

## Example

```ts
import { LitElement, html } from 'lit'
import { createMutationController } from '@tanstack/lit-query'

class AddTodoForm extends LitElement {
  private readonly addTodo = createMutationController(this, {
    mutationFn: (title: string) =>
      fetch('/api/todos', { method: 'POST', body: JSON.stringify({ title }) }),
  })

  render() {
    const mutation = this.addTodo()

    return html`
      <button ?disabled=${mutation.isPending} @click=${() => this.addTodo.mutate('Ship docs')}>
        Add todo
      </button>
    `
  }
}
```
