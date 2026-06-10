---
id: mutations
title: Mutations
---

Unlike queries, mutations are used to create, update, delete, or otherwise perform server side effects. In Lit, use [`createMutationController`](../reference/functions/createMutationController.md).

```ts
import { LitElement, html } from 'lit'
import {
  QueryClient,
  QueryClientProvider,
  createMutationController,
  createQueryController,
} from '@tanstack/lit-query'

const queryClient = new QueryClient()

class AppQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

customElements.define('app-query-provider', AppQueryProvider)

class TodosView extends LitElement {
  private readonly todos = createQueryController(this, {
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  private readonly addTodo = createMutationController(this, {
    mutationFn: createTodo,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  render() {
    const query = this.todos()
    const mutation = this.addTodo()
    const todos = query.data ?? []

    return html`
      ${mutation.isError ? html`<p>${mutation.error.message}</p>` : null}
      ${mutation.isSuccess ? html`<p>Todo added</p>` : null}

      <button
        ?disabled=${mutation.isPending}
        @click=${() => this.addTodo.mutate({ title: 'Write mutation docs' })}
      >
        ${mutation.isPending ? 'Adding...' : 'Add Todo'}
      </button>

      <ul>
        ${todos.map((todo) => html`<li>${todo.title}</li>`)}
      </ul>
    `
  }
}

customElements.define('todos-view', TodosView)
```

Render the element under the provider so the controllers can resolve the same `QueryClient` from Lit context:

```html
<app-query-provider>
  <todos-view></todos-view>
</app-query-provider>
```

## Mutation States

A mutation can be in one of these primary states:

- `isIdle` or `status === 'idle'`: no mutation has run or it has been reset
- `isPending` or `status === 'pending'`: the mutation is running
- `isError` or `status === 'error'`: the mutation failed and `error` is available
- `isSuccess` or `status === 'success'`: the mutation finished and `data` is available

## Variables

Pass variables to the mutation function by calling `mutate`:

```ts
this.addTodo.mutate({
  title: this.nextTitle,
})
```

`mutate` throws synchronously if the controller cannot resolve a `QueryClient`, such as when the element is not under a connected `QueryClientProvider` and no explicit client was passed. `mutateAsync` reports the same setup problem as a rejected promise.

Use `mutateAsync` when you want a promise:

```ts
try {
  const created = await this.addTodo.mutateAsync({ title: this.nextTitle })
  this.nextTitle = created.title
} catch (error) {
  this.errorMessage = String(error)
}
```

## Resetting Mutation State

The accessor includes `reset`:

```ts
html`
  ${mutation.isError
    ? html`<button @click=${() => this.addTodo.reset()}>Clear error</button>`
    : null}
`
```

## Side Effects

Mutation options support `onMutate`, `onError`, `onSuccess`, and `onSettled`. The pagination example passes an explicit `queryClient` to the controller and uses the same in-scope client for optimistic updates and rollback:

```ts
private readonly favoriteMutation = createMutationController(
  this,
  {
    mutationKey: ['toggle-project-favorite'],
    mutationFn: async (input) => {
      const response = await toggleProjectFavoriteOnServer(input)
      return response.project
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      const snapshots = queryClient.getQueriesData<ProjectsPageResponse>({
        queryKey: ['projects'],
      })

      for (const [key, existing] of snapshots) {
        if (!existing) continue

        queryClient.setQueryData<ProjectsPageResponse>(key, {
          ...existing,
          projects: existing.projects.map((project) =>
            project.id === variables.id
              ? { ...project, isFavorite: variables.isFavorite }
              : project,
          ),
        })
      }

      return { snapshots }
    },
    onError: (_error, _variables, context) => {
      for (const [key, snapshot] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, snapshot)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  },
  queryClient,
)
```

For the exact runnable flow, see the [Pagination example](../examples/pagination).
