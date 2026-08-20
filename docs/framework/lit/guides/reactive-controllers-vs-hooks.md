---
id: reactive-controllers-vs-hooks
title: Reactive Controllers vs Hooks
---

React Query examples use hooks. Lit Query uses reactive controllers.

The job is similar: subscribe a component to a `QueryClient`, read the latest result, and update the component when the cache changes. The integration point is different because Lit components use the `ReactiveControllerHost` interface instead of React's render and hook system.

## Mapping the Concepts

| React Query                 | Lit Query                                      |
| --------------------------- | ---------------------------------------------- |
| `useQuery(options)`         | `createQueryController(this, options)`         |
| `useQueries(options)`       | `createQueriesController(this, options)`       |
| `useMutation(options)`      | `createMutationController(this, options)`      |
| `useInfiniteQuery(options)` | `createInfiniteQueryController(this, options)` |
| `useIsFetching(options)`    | `useIsFetching(this, options)`                 |
| `useIsMutating(options)`    | `useIsMutating(this, options)`                 |
| `useMutationState(options)` | `useMutationState(this, options)`              |
| Hook result object          | Callable result accessor                       |
| React context provider      | `QueryClientProvider` custom element           |
| Component render rerun      | `host.requestUpdate()`                         |

## Host-Bound APIs

Lit APIs that subscribe a component to query or mutation state receive a `host` as the first argument:

```ts
class TodosView extends LitElement {
  private readonly todos = createQueryController(this, {
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })
}
```

`this` is valid because `LitElement` implements `ReactiveControllerHost`. The controller attaches to the host, subscribes when the host connects, requests updates when the query result changes, and unsubscribes when the host disconnects.

The host-bound APIs are [`createQueryController`](../reference/functions/createQueryController.md), [`createQueriesController`](../reference/functions/createQueriesController.md), [`createInfiniteQueryController`](../reference/functions/createInfiniteQueryController.md), [`createMutationController`](../reference/functions/createMutationController.md), [`useIsFetching`](../reference/functions/useIsFetching.md), [`useIsMutating`](../reference/functions/useIsMutating.md), and [`useMutationState`](../reference/functions/useMutationState.md).

[`useQueryClient`](../reference/functions/useQueryClient.md) is different. It is not a reactive controller, does not accept a host, does not subscribe, and throws synchronously if no single default client is available. Use it only for imperative code that runs while exactly one `QueryClientProvider` is connected. Inside host-bound APIs, prefer the provider context or pass an explicit `QueryClient`.

## Reading Results

Lit Query controller creators return a callable accessor with a `current` property:

```ts
const query = this.todos()
const sameQuery = this.todos.current
```

Render methods normally call the accessor:

```ts
render() {
  const query = this.todos()

  if (query.isPending) return html`Loading...`
  if (query.isError) return html`Error: ${query.error.message}`

  return html`<todo-list .items=${query.data}></todo-list>`
}
```

## Reactive Options

If query options depend on host state, pass a function. Lit Query re-reads function accessors during host updates:

```ts
class ProjectView extends LitElement {
  static properties = {
    projectId: { type: Number },
  }

  projectId = 1

  private readonly project = createQueryController(this, () => ({
    queryKey: ['project', this.projectId],
    queryFn: () => fetchProject(this.projectId),
  }))
}
```

If options are static, pass an object. If you mutate a static options object yourself, call the controller helper that causes the observer to see the new options, such as `refetch`, or prefer a function accessor for reactive state.

## Provider Context

Host-bound APIs can receive an explicit `QueryClient`, but most apps render under [`QueryClientProvider`](../reference/classes/QueryClientProvider.md). The provider uses Lit context to deliver the client to descendant controllers.

```ts
customElements.define('query-client-provider', QueryClientProvider)
```

```ts
html`
  <query-client-provider .client=${queryClient}>
    <todos-view></todos-view>
  </query-client-provider>
`
```

Custom element registration is always the application's responsibility.

`QueryClientProvider` also registers its client in a process-local fallback store for [`useQueryClient`](../reference/functions/useQueryClient.md) and [`resolveQueryClient`](../reference/functions/resolveQueryClient.md). That fallback is intentionally conservative:

- If no provider is connected, `useQueryClient()` throws.
- If exactly one distinct client is connected, `useQueryClient()` returns it.
- If multiple distinct clients are connected in the same JavaScript context, `useQueryClient()` and `resolveQueryClient()` throw because the fallback would be ambiguous.

Multiple roots, micro-frontends, test suites with shared modules, and nested apps should avoid relying on the process-local fallback. Render host-bound controllers under the right provider, pass an explicit `QueryClient` to the controller, or cleanly disconnect providers between tests.
