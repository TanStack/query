---
id: paginated-queries
title: Paginated / Lagged Queries
ref: docs/framework/react/guides/paginated-queries.md
replace: { 'hook': 'function' }
---

[//]: # 'Example'

```tsx
const projectsQuery = useQuery(() => ({
  queryKey: ['projects', page()],
  queryFn: () => fetchProjects(page()),
}))
```

[//]: # 'Example'
[//]: # 'Example2'

```tsx
import { createSignal, Switch, Match, Show, For } from 'solid-js'
import { keepPreviousData, useQuery } from '@tanstack/solid-query'

function Todos() {
  const [page, setPage] = createSignal(0)

  const fetchProjects = (page = 0) =>
    fetch('/api/projects?page=' + page).then((res) => res.json())

  const projectsQuery = useQuery(() => ({
    queryKey: ['projects', page()],
    queryFn: () => fetchProjects(page()),
    placeholderData: keepPreviousData,
  }))

  return (
    <div>
      <Switch>
        <Match when={projectsQuery.isPending}>
          <div>Loading...</div>
        </Match>
        <Match when={projectsQuery.isError}>
          <div>Error: {projectsQuery.error.message}</div>
        </Match>
        <Match when={projectsQuery.isSuccess}>
          <div>
            <For each={projectsQuery.data.projects}>
              {(project) => <p>{project.name}</p>}
            </For>
          </div>
        </Match>
      </Switch>
      <span>Current Page: {page() + 1}</span>
      <button
        onClick={() => setPage((old) => Math.max(old - 1, 0))}
        disabled={page() === 0}
      >
        Previous Page
      </button>
      <button
        onClick={() => {
          if (!projectsQuery.isPlaceholderData && projectsQuery.data?.hasMore) {
            setPage((old) => old + 1)
          }
        }}
        // Disable the Next Page button until we know a next page is available
        disabled={
          projectsQuery.isPlaceholderData || !projectsQuery.data?.hasMore
        }
      >
        Next Page
      </button>
      <Show when={projectsQuery.isFetching}>
        <span> Loading...</span>
      </Show>
    </div>
  )
}
```

[//]: # 'Example2'
