---
id: disabling-queries
title: Disabling/Pausing Queries
ref: docs/framework/react/guides/disabling-queries.md
---

[//]: # 'Example'

```tsx
import { Switch, Match, Show, For } from 'solid-js'

function Todos() {
  const todosQuery = useQuery(() => ({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
    enabled: false,
  }))

  return (
    <div>
      <button onClick={() => todosQuery.refetch()}>Fetch Todos</button>

      <Switch>
        <Match when={todosQuery.data}>
          <ul>
            <For each={todosQuery.data}>
              {(todo) => <li>{todo.title}</li>}
            </For>
          </ul>
        </Match>
        <Match when={todosQuery.isError}>
          <span>Error: {todosQuery.error.message}</span>
        </Match>
        <Match when={todosQuery.isLoading}>
          <span>Loading...</span>
        </Match>
        <Match when={true}>
          <span>Not ready ...</span>
        </Match>
      </Switch>

      <div>{todosQuery.isFetching ? 'Fetching...' : null}</div>
    </div>
  )
}
```

[//]: # 'Example'
[//]: # 'Example2'

```tsx
import { createSignal } from 'solid-js'

function Todos() {
  const [filter, setFilter] = createSignal('')

  const todosQuery = useQuery(() => ({
    queryKey: ['todos', filter()],
    queryFn: () => fetchTodos(filter()),
    // ⬇️ disabled as long as the filter is empty
    enabled: !!filter(),
  }))

  return (
    <div>
      {/* 🚀 applying the filter will enable and execute the query */}
      <FiltersForm onApply={setFilter} />
      <Show when={todosQuery.data}>
        <TodosTable data={todosQuery.data} />
      </Show>
    </div>
  )
}
```

[//]: # 'Example2'
[//]: # 'Example3'

```tsx
import { createSignal } from 'solid-js'
import { skipToken, useQuery } from '@tanstack/solid-query'

function Todos() {
  const [filter, setFilter] = createSignal<string | undefined>()

  const todosQuery = useQuery(() => ({
    queryKey: ['todos', filter()],
    // ⬇️ disabled as long as the filter is undefined or empty
    queryFn: filter() ? () => fetchTodos(filter()!) : skipToken,
  }))

  return (
    <div>
      {/* 🚀 applying the filter will enable and execute the query */}
      <FiltersForm onApply={setFilter} />
      <Show when={todosQuery.data}>
        <TodosTable data={todosQuery.data} />
      </Show>
    </div>
  )
}
```

[//]: # 'Example3'
