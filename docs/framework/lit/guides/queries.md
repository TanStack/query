---
id: queries
title: Queries
---

New to Lit Query? Start with [Installation](../installation.md) and [Quick Start](../quick-start.md) before wiring query controllers into your elements.

## Query Basics

A query is a declarative dependency on an asynchronous source of data tied to a unique key. Use queries for reading server state. If a function creates, updates, or deletes server data, use a [mutation](./mutations.md) instead.

In Lit, subscribe to a query with [`createQueryController`](../reference/functions/createQueryController.md):

```ts
import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'

class TodosView extends LitElement {
  private readonly todos = createQueryController(this, {
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  render() {
    const query = this.todos()

    if (query.isPending) return html`Loading...`
    if (query.isError) return html`Error: ${query.error.message}`

    return html`
      <ul>
        ${query.data.map((todo) => html`<li>${todo.title}</li>`)}
      </ul>
    `
  }
}
```

The controller needs:

- A `ReactiveControllerHost`, usually `this` inside a `LitElement`
- A unique `queryKey`
- A `queryFn` that returns a promise and throws on errors

The returned accessor exposes the current `QueryObserverResult`. Call it in `render`, or read `.current`:

```ts
const query = this.todos()
const sameQuery = this.todos.current
```

## Query States

A query can be in one primary state at a time:

- `isPending` or `status === 'pending'`: no data is available yet
- `isError` or `status === 'error'`: the query failed and `error` is available
- `isSuccess` or `status === 'success'`: data is available

The result also includes `isFetching`, which can be true during the initial load or a background refetch.

```ts
render() {
  const query = this.todos()

  if (query.status === 'pending') {
    return html`<span>Loading...</span>`
  }

  if (query.status === 'error') {
    return html`<span>Error: ${query.error.message}</span>`
  }

  return html`<todo-list .items=${query.data}></todo-list>`
}
```

TypeScript will narrow `query.data` after you check `pending` and `error` before reading it.

## Fetch Status

The `status` field describes whether data is available. The `fetchStatus` field describes what the query function is doing:

- `fetchStatus === 'fetching'`: the query is currently fetching.
- `fetchStatus === 'paused'`: the query wanted to fetch, but fetching is paused.
- `fetchStatus === 'idle'`: the query is not fetching.

These states are intentionally separate. Background refetching and stale-while-revalidate behavior can produce combinations like:

- A successful query with cached data can have `status === 'success'` and `fetchStatus === 'fetching'` while a background refetch is running.
- A query with no data can have `status === 'pending'` and `fetchStatus === 'paused'` if fetching cannot start yet.

Use `status` when deciding whether data can be rendered, and use `fetchStatus` or `isFetching` when deciding whether to show a network activity indicator:

```ts
render() {
  const query = this.todos()

  if (query.isPending) return html`Loading...`
  if (query.isError) return html`Error: ${query.error.message}`

  return html`
    ${query.fetchStatus === 'fetching'
      ? html`<span>Refreshing...</span>`
      : null}
    <todo-list .items=${query.data}></todo-list>
  `
}
```

## Reactive Query Options

Use an options getter when the query key or query function depends on host state:

```ts
class UserTodos extends LitElement {
  static properties = {
    userId: { type: String },
  }

  userId = ''

  private readonly todos = createQueryController(this, () => ({
    queryKey: ['todos', this.userId],
    queryFn: () => fetchTodos(this.userId),
    enabled: this.userId.length > 0,
  }))
}
```

The query key is used for caching, refetching, and sharing data between controllers.

## Refetching

The accessor includes `refetch`:

```ts
html`<button @click=${() => this.todos.refetch()}>Refetch</button>`
```

For multiple queries that should run at the same time, see [Parallel Queries](./parallel-queries.md).
