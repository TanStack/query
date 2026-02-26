---
id: background-fetching-indicators
title: Background Fetching Indicators
ref: docs/framework/react/guides/background-fetching-indicators.md
replace: { 'hook': 'function' }
---

[//]: # 'Example'

```tsx
import { Switch, Match, Show, For } from 'solid-js'

function Todos() {
  const todosQuery = useQuery(() => ({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  }))

  return (
    <Switch>
      <Match when={todosQuery.isPending}>
        <span>Loading...</span>
      </Match>
      <Match when={todosQuery.isError}>
        <span>Error: {todosQuery.error.message}</span>
      </Match>
      <Match when={todosQuery.isSuccess}>
        <Show when={todosQuery.isFetching}>
          <div>Refreshing...</div>
        </Show>
        <div>
          <For each={todosQuery.data}>{(todo) => <Todo todo={todo} />}</For>
        </div>
      </Match>
    </Switch>
  )
}
```

[//]: # 'Example'
[//]: # 'Example2'

```tsx
import { useIsFetching } from '@tanstack/solid-query'

function GlobalLoadingIndicator() {
  const isFetching = useIsFetching()

  return (
    <Show when={isFetching()}>
      <div>Queries are fetching in the background...</div>
    </Show>
  )
}
```

[//]: # 'Example2'
