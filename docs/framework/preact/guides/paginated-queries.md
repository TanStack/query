---
id: paginated-queries
title: Paginated / Lagged Queries
---

Rendering paginated data is a very common UI pattern and in TanStack Query, it "just works" by including the page information in the query key:

[//]: # 'Example'

```tsx
const result = useQuery({
  queryKey: ['projects', page],
  queryFn: () => fetchProjects(page),
})
```

[//]: # 'Example'

However, if you run this simple example, you might notice something strange:

**The UI jumps in and out of the `success` and `pending` states because each new page is treated like a brand new query.**

This experience is not optimal and unfortunately is how many tools today insist on working. But not TanStack Query! As you may have guessed, TanStack Query comes with an awesome feature called `placeholderData` that allows us to get around this.

## Better Paginated Queries with `placeholderData`

Consider the following example where we would ideally want to increment a pageIndex (or cursor) for a query. If we were to use `useQuery`, **it would still technically work fine**, but the UI would jump in and out of the `success` and `pending` states as different queries are created and destroyed for each page or cursor. By setting `placeholderData` to `(previousData) => previousData` or `keepPreviousData` function exported from TanStack Query, we get a few new things:

- **The data from the last successful fetch is available while new data is being requested, even though the query key has changed**.
- When the new data arrives, the previous `data` is seamlessly swapped to show the new data.
- `isPlaceholderData` is made available to know what data the query is currently providing you

[//]: # 'Example2'

```tsx
import { keepPreviousData, useQuery } from '@tanstack/preact-query'
import { useState } from 'preact/hooks'

function Todos() {
  const [page, setPage] = useState(0)

  const fetchProjects = (page = 0) =>
    fetch('/api/projects?page=' + page).then((res) => res.json())

  const { isPending, isError, error, data, isFetching, isPlaceholderData } =
    useQuery({
      queryKey: ['projects', page],
      queryFn: () => fetchProjects(page),
      placeholderData: keepPreviousData,
    })

  return (
    <div>
      {isPending ? (
        <div>Loading...</div>
      ) : isError ? (
        <div>Error: {error.message}</div>
      ) : (
        <div>
          {data.projects.map((project) => (
            <p key={project.id}>{project.name}</p>
          ))}
        </div>
      )}
      <span>Current Page: {page + 1}</span>
      <button
        onClick={() => setPage((old) => Math.max(old - 1, 0))}
        disabled={page === 0}
      >
        Previous Page
      </button>
      <button
        onClick={() => {
          if (!isPlaceholderData && data.hasMore) {
            setPage((old) => old + 1)
          }
        }}
        // Disable the Next Page button until we know a next page is available
        disabled={isPlaceholderData || !data?.hasMore}
      >
        Next Page
      </button>
      {isFetching ? <span> Loading...</span> : null}
    </div>
  )
}
```

[//]: # 'Example2'

## Lagging Infinite Query results with `placeholderData`

While not as common, the `placeholderData` option also works flawlessly with the `useInfiniteQuery` hook, so you can seamlessly allow your users to continue to see cached data while infinite query keys change over time.
