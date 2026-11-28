---
id: infinite-queries
title: Infinite Queries
ref: docs/framework/react/guides/infinite-queries.md
replace: { 'react-query': 'preact-query', 'React': 'Preact' }
---

[//]: # 'Example'

```tsx
import {
  useQuery,
  infiniteQueryOptions,
  isFetching,
  isFetchingNextPage,
} from '@tanstack/preact-query'

function Projects() {
  const fetchProjects = async ({ pageParam }) => {
    const res = await fetch('/api/projects?cursor=' + pageParam)
    return res.json()
  }

  const infiniteQueryResult = useQuery(
    infiniteQueryOptions({
      queryKey: ['projects'],
      queryFn: fetchProjects,
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
    }),
  )

  return infiniteQueryResult.status === 'pending' ? (
    <p>Loading...</p>
  ) : infiniteQueryResult.status === 'error' ? (
    <p>Error: {infiniteQueryResult.error.message}</p>
  ) : (
    <>
      {infiniteQueryResult.data.pages.map((group, i) => (
        <div key={i}>
          {group.data.map((project) => (
            <p key={project.id}>{project.name}</p>
          ))}
        </div>
      ))}
      <div>
        <button
          onClick={() => infiniteQueryResult.fetchNextPage()}
          disabled={
            !infiniteQueryResult.hasNextPage || isFetching(infiniteQueryResult)
          }
        >
          {isFetchingNextPage(infiniteQueryResult)
            ? 'Loading more...'
            : infiniteQueryResult.hasNextPage
              ? 'Load More'
              : 'Nothing more to load'}
        </button>
      </div>
      <div>
        {isFetching(infiniteQueryResult) &&
        !isFetchingNextPage(infiniteQueryResult)
          ? 'Fetching...'
          : null}
      </div>
    </>
  )
}
```

[//]: # 'Example'
