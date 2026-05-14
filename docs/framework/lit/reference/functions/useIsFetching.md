---
id: useIsFetching
title: useIsFetching
---

# Function: useIsFetching()

```ts
function useIsFetching(
   host,
   filters,
   queryClient?): IsFetchingAccessor;
```

Defined in: [packages/lit-query/src/useIsFetching.ts:147](https://github.com/TanStack/query/blob/main/packages/lit-query/src/useIsFetching.ts#L147)

Creates a Lit reactive controller that tracks how many matching queries are
currently fetching.

When `filters` is a function, it is re-read during host updates so the count
can follow reactive host state. If `queryClient` is omitted, the controller
resolves the client from the nearest connected `QueryClientProvider`.

## Parameters

### host

`ReactiveControllerHost`

The Lit reactive controller host that owns the cache
subscription.

### filters

[`Accessor`](../type-aliases/Accessor.md)\<`QueryFilters`\<readonly `unknown`[]\>\> = `{}`

Query filters, or a getter that returns query filters.

### queryClient?

`QueryClient`

Optional explicit query client. Provide this for
controllers that should not resolve a client from Lit context.

## Returns

[`IsFetchingAccessor`](../type-aliases/IsFetchingAccessor.md)

An accessor for the current number of matching fetching queries.

## Example

```ts
import { LitElement, html } from 'lit'
import { useIsFetching } from '@tanstack/lit-query'

class TodosStatus extends LitElement {
  private readonly todosFetching = useIsFetching(this, {
    queryKey: ['todos'],
  })

  render() {
    return html`<span>${this.todosFetching()} active todo fetches</span>`
  }
}
```
