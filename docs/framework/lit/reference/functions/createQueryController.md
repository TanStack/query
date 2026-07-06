---
id: createQueryController
title: createQueryController
---

# Function: createQueryController()

```ts
function createQueryController<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
   host,
   options,
queryClient?): QueryResultAccessor<TData, TError>;
```

Defined in: [packages/lit-query/src/createQueryController.ts:319](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createQueryController.ts#L319)

Creates a Lit reactive controller that subscribes the host to a single query.

The returned accessor is callable and also exposes `current`, `refetch`,
`suspense`, and `destroy`. When `options` is a function, it is re-read during
host updates so query keys and options can follow reactive host state.

If `queryClient` is omitted, the controller resolves the client from the
nearest connected `QueryClientProvider`.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `Error`

### TData

`TData` = `TQueryFnData`

### TQueryData

`TQueryData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

## Parameters

### host

`ReactiveControllerHost`

The Lit reactive controller host that owns the query
subscription.

### options

[`Accessor`](../type-aliases/Accessor.md)\<[`CreateQueryOptions`](../type-aliases/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>\>

Query observer options, or a getter that returns options.

### queryClient?

`QueryClient`

Optional explicit query client. Provide this for
controllers that should not resolve a client from Lit context.

## Returns

[`QueryResultAccessor`](../type-aliases/QueryResultAccessor.md)\<`TData`, `TError`\>

An accessor for the latest query result with query helper methods.

## Example

```ts
import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'

class TodosView extends LitElement {
  private readonly todos = createQueryController(this, {
    queryKey: ['todos'],
    queryFn: async () => fetch('/api/todos').then((r) => r.json()),
  })

  render() {
    const query = this.todos()

    if (query.isPending) return html`Loading...`
    if (query.isError) return html`Error`

    return html`<ul>${query.data.map((todo) => html`<li>${todo.title}</li>`)}</ul>`
  }
}
```
