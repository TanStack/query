---
id: createQueriesController
title: createQueriesController
---

# Function: createQueriesController()

```ts
function createQueriesController<TQueryOptions, TCombinedResult>(
   host,
   options,
queryClient?): QueriesResultAccessor<TCombinedResult>;
```

Defined in: [packages/lit-query/src/createQueriesController.ts:615](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createQueriesController.ts#L615)

Creates a Lit reactive controller that subscribes the host to multiple
queries.

The returned accessor is callable and also exposes `current` and `destroy`.
When `options` or `options.queries` is a function, it is re-read during host
updates so the query list can follow reactive host state.

If `queryClient` is omitted, the controller resolves the client from the
nearest connected `QueryClientProvider`.

## Type Parameters

### TQueryOptions

`TQueryOptions` *extends* `any`[]

### TCombinedResult

`TCombinedResult` = `CreateQueriesResults`\<`TQueryOptions`\>

## Parameters

### host

`ReactiveControllerHost`

The Lit reactive controller host that owns the queries
subscription.

### options

[`Accessor`](../type-aliases/Accessor.md)\<[`CreateQueriesControllerOptions`](../type-aliases/CreateQueriesControllerOptions.md)\<`TQueryOptions`, `TCombinedResult`\>\>

Queries controller options, or a getter that returns options.

### queryClient?

`QueryClient`

Optional explicit query client. Provide this for
controllers that should not resolve a client from Lit context.

## Returns

[`QueriesResultAccessor`](../type-aliases/QueriesResultAccessor.md)\<`TCombinedResult`\>

An accessor for the latest query results, or the value returned by
`combine`.

## Example

```ts
import { LitElement, html } from 'lit'
import { createQueriesController } from '@tanstack/lit-query'

class DashboardView extends LitElement {
  private readonly dashboard = createQueriesController(this, {
    queries: [
      { queryKey: ['stats'], queryFn: fetchStats },
      { queryKey: ['projects'], queryFn: fetchProjects },
    ],
    combine: ([stats, projects]) => ({
      stats: stats.data,
      projects: projects.data ?? [],
      isPending: stats.isPending || projects.isPending,
    }),
  })

  render() {
    const dashboard = this.dashboard()
    return html`<p>Projects: ${dashboard.projects.length}</p>`
  }
}
```
