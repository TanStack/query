---
id: infinite-queries
title: Infinite Queries
ref: docs/framework/react/guides/infinite-queries.md
---

[//]: # 'Example'

```tsx
import { Switch, Match, For, Show } from 'solid-js'
import { useInfiniteQuery } from '@tanstack/solid-query'

function Projects() {
  const fetchProjects = async ({ pageParam }) => {
    const res = await fetch('/api/projects?cursor=' + pageParam)
    return res.json()
  }

  const projectsQuery = useInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  }))

  return (
    <Switch>
      <Match when={projectsQuery.isPending}>
        <p>Loading...</p>
      </Match>
      <Match when={projectsQuery.isError}>
        <p>Error: {projectsQuery.error.message}</p>
      </Match>
      <Match when={projectsQuery.isSuccess}>
        <For each={projectsQuery.data.pages}>
          {(group) => (
            <For each={group.data}>{(project) => <p>{project.name}</p>}</For>
          )}
        </For>
        <div>
          <button
            onClick={() => projectsQuery.fetchNextPage()}
            disabled={!projectsQuery.hasNextPage || projectsQuery.isFetching}
          >
            {projectsQuery.isFetchingNextPage
              ? 'Loading more...'
              : projectsQuery.hasNextPage
                ? 'Load More'
                : 'Nothing more to load'}
          </button>
        </div>
        <Show
          when={projectsQuery.isFetching && !projectsQuery.isFetchingNextPage}
        >
          <div>Fetching...</div>
        </Show>
      </Match>
    </Switch>
  )
}
```

[//]: # 'Example'
[//]: # 'Example1'

```jsx
<List
  onEndReached={() =>
    projectsQuery.hasNextPage &&
    !projectsQuery.isFetching &&
    projectsQuery.fetchNextPage()
  }
/>
```

[//]: # 'Example1'
[//]: # 'Example3'

```tsx
useInfiniteQuery(() => ({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  initialPageParam: 0,
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage, pages) => firstPage.prevCursor,
}))
```

[//]: # 'Example3'
[//]: # 'Example4'

```tsx
useInfiniteQuery(() => ({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  select: (data) => ({
    pages: [...data.pages].reverse(),
    pageParams: [...data.pageParams].reverse(),
  }),
}))
```

[//]: # 'Example4'
[//]: # 'Example8'

```tsx
useInfiniteQuery(() => ({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  initialPageParam: 0,
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage, pages) => firstPage.prevCursor,
  maxPages: 3,
}))
```

[//]: # 'Example8'
[//]: # 'Example9'

```tsx
return useInfiniteQuery(() => ({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  initialPageParam: 0,
  getNextPageParam: (lastPage, allPages, lastPageParam) => {
    if (lastPage.length === 0) {
      return undefined
    }
    return lastPageParam + 1
  },
  getPreviousPageParam: (firstPage, allPages, firstPageParam) => {
    if (firstPageParam <= 1) {
      return undefined
    }
    return firstPageParam - 1
  },
}))
```

[//]: # 'Example9'
