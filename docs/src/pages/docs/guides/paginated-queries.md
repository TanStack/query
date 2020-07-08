---
id: paginated-queries
title: Paginated Queries
---

Rendering paginated data is a very common UI pattern to avoid overloading bandwidth or even your UI. React Query exposes a `usePaginatedQuery` that is very similar to `useQuery` that helps with this very scenario.

Consider the following example where we would ideally want to increment a pageIndex (or cursor) for a query. If we were to use `useQuery`, it would technically work fine, but the UI would jump in and out of the `success` and `loading` states as different queries are created and destroyed for each page or cursor. By using `usePaginatedQuery` we get a few new things:

- Instead of `data`, you should use `resolvedData` instead. This is the data from the last known successful query result. As new page queries resolve, `resolvedData` remains available to show the last page's data while a new page is requested. When the new page data is received, `resolvedData` gets updated to the new page's data.
- If you specifically need the data for the exact page being requested, `latestData` is available. When the desired page is being requested, `latestData` will be `undefined` until the query resolves, then it will get updated with the latest pages data result.

```js
function Todos() {
  const [page, setPage] = React.useState(0)

  const fetchProjects = (key, page = 0) => fetch('/api/projects?page=' + page)

  const {
    isLoading,
    isError,
    error,
    resolvedData,
    latestData,
    isFetching,
  } = usePaginatedQuery(['projects', page], fetchProjects)

  return (
    <div>
      {isLoading ? (
        <div>Loading...</div>
      ) : isError ? (
        <div>Error: {error.message}</div>
      ) : (
        // `resolvedData` will either resolve to the latest page's data
        // or if fetching a new page, the last successful page's data
        <div>
          {resolvedData.projects.map(project => (
            <p key={project.id}>{project.name}</p>
          ))}
        </div>
      )}
      <span>Current Page: {page + 1}</span>
      <button
        onClick={() => setPage(old => Math.max(old - 1, 0))}
        disabled={page === 0}
      >
        Previous Page
      </button>{' '}
      <button
        onClick={() =>
          // Here, we use `latestData` so the Next Page
          // button isn't relying on potentially old data
          setPage(old => (!latestData || !latestData.hasMore ? old : old + 1))
        }
        disabled={!latestData || !latestData.hasMore}
      >
        Next Page
      </button>
      {
        // Since the last page's data potentially sticks around between page requests,
        // we can use `isFetching` to show a background loading
        // indicator since our `status === 'loading'` state won't be triggered
        isFetching ? <span> Loading...</span> : null
      }{' '}
    </div>
  )
}
```
