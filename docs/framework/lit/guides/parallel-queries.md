---
id: parallel-queries
title: Parallel Queries
---

Parallel queries are queries that run at the same time so the UI does not wait for one request before starting the next.

## Manual Parallel Queries

When the number of queries is fixed, create multiple query controllers on the same host. They will all subscribe when the host connects.

```ts
import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'

class DashboardView extends LitElement {
  private readonly users = createQueryController(this, {
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  private readonly teams = createQueryController(this, {
    queryKey: ['teams'],
    queryFn: fetchTeams,
  })

  private readonly projects = createQueryController(this, {
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })

  render() {
    const users = this.users()
    const teams = this.teams()
    const projects = this.projects()

    if (users.isPending || teams.isPending || projects.isPending) {
      return html`Loading...`
    }

    if (users.isError || teams.isError || projects.isError) {
      return html`Unable to load dashboard`
    }

    return html`
      <dashboard-summary
        .users=${users.data}
        .teams=${teams.data}
        .projects=${projects.data}
      ></dashboard-summary>
    `
  }
}
```

Each controller receives the same `ReactiveControllerHost`. If no explicit `QueryClient` is passed, each controller resolves the nearest connected `QueryClientProvider`.

## Dynamic Parallel Queries

When the number of queries changes with host state, use [`createQueriesController`](../reference/functions/createQueriesController.md). It accepts a `queries` array and returns an accessor for the array of query results.

Use an options getter when the query list depends on reactive host fields:

```ts
import { LitElement, html } from 'lit'
import { createQueriesController } from '@tanstack/lit-query'

class UsersDetails extends LitElement {
  static properties = {
    userIds: { attribute: false },
  }

  userIds: Array<string> = []

  private readonly users = createQueriesController(this, () => ({
    queries: this.userIds.map((id) => ({
      queryKey: ['user', id],
      queryFn: () => fetchUserById(id),
    })),
  }))

  render() {
    const userQueries = this.users()

    return html`
      <ul>
        ${userQueries.map((query, index) => {
          if (query.isPending) return html`<li>Loading...</li>`
          if (query.isError) return html`<li>Error loading user</li>`

          return html`<li>${this.userIds[index]}: ${query.data.name}</li>`
        })}
      </ul>
    `
  }
}
```

The order of the results matches the order of the input queries.

## Combining Results

Use `combine` when a component wants one derived value instead of an array of query results:

```ts
private readonly dashboard = createQueriesController(this, {
  queries: [
    { queryKey: ['stats'], queryFn: fetchStats },
    { queryKey: ['projects'], queryFn: fetchProjects },
  ],
  combine: ([stats, projects]) => ({
    activeUsers: stats.data?.activeUsers ?? 0,
    projects: projects.data ?? [],
    isPending: stats.isPending || projects.isPending,
    isError: stats.isError || projects.isError,
  }),
})
```

```ts
render() {
  const dashboard = this.dashboard()

  if (dashboard.isPending) return html`Loading...`
  if (dashboard.isError) return html`Unable to load dashboard`

  return html`
    <p>Total projects: ${dashboard.projects.length}</p>
    <p>Active users: ${dashboard.activeUsers}</p>
  `
}
```

Having the same query key more than once in the `queries` array can cause those entries to share cached data. Deduplicate repeated keys first if each rendered row needs independent query state.
