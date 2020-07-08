---
id: infinite-queries
title: Infinite Queries
---

Rendering lists that can additively "load more" data onto an existing set of data or "infinite scroll" is also a very common UI pattern. React Query supports a useful version of `useQuery` called `useInfiniteQuery` for querying these types of lists.

When using `useInfiniteQuery`, you'll notice a few things are different:

- `data` is now an array of arrays that contain query group results, instead of the query results themselves
- A `fetchMore` function is now available
- A `getFetchMore` option is available for both determining if there is more data to load and the information to fetch it. This information is supplied as an additional parameter in the query function (which can optionally be overridden when calling the `fetchMore` function)
- A `canFetchMore` boolean is now available and is `true` if `getFetchMore` returns a truthy value
- An `isFetchingMore` boolean is now available to distinguish between a background refresh state and a loading more state

## Example

Let's assume we have an API that returns pages of `projects` 3 at a time based on a `cursor` index along with a cursor that can be used to fetch the next group of projects:

```js
fetch('/api/projects?cursor=0')
// { data: [...], nextCursor: 3}
fetch('/api/projects?cursor=3')
// { data: [...], nextCursor: 6}
fetch('/api/projects?cursor=6')
// { data: [...], nextCursor: 9}
fetch('/api/projects?cursor=9')
// { data: [...] }
```

With this information, we can create a "Load More" UI by:

- Waiting for `useInfiniteQuery` to request the first group of data by default
- Returning the information for the next query in `getFetchMore`
- Calling `fetchMore` function

> Note: It's very important you do not call `fetchMore` with arguments unless you want them to override the `fetchMoreInfo` data returned from the `getFetchMore` function. eg. Do not do this: `<button onClick={fetchMore} />` as this would send the onClick event to the `fetchMore` function.

```js
import { useInfiniteQuery } from 'react-query'

function Projects() {
  const fetchProjects = (key, cursor = 0) =>
    fetch('/api/projects?cursor=' + cursor)

  const {
    status,
    data,
    isFetching,
    isFetchingMore,
    fetchMore,
    canFetchMore,
  } = useInfiniteQuery('projects', fetchProjects, {
    getFetchMore: (lastGroup, allGroups) => lastGroup.nextCursor,
  })

  return status === 'loading' ? (
    <p>Loading...</p>
  ) : status === 'error' ? (
    <p>Error: {error.message}</p>
  ) : (
    <>
      {data.map((group, i) => (
        <React.Fragment key={i}>
          {group.projects.map(project => (
            <p key={project.id}>{project.name}</p>
          ))}
        </React.Fragment>
      ))}
      <div>
        <button
          onClick={() => fetchMore()}
          disabled={!canFetchMore || isFetchingMore}
        >
          {isFetchingMore
            ? 'Loading more...'
            : canFetchMore
            ? 'Load More'
            : 'Nothing more to load'}
        </button>
      </div>
      <div>{isFetching && !isFetchingMore ? 'Fetching...' : null}</div>
    </>
  )
}
```

## What happens when an infinite query needs to be refetched?

When an infinite query becomes `stale` and needs to be refetched, each group is fetched `sequentially`, starting from the first one. This ensures that even if the underlying data is mutated we're not using stale cursors and potentially getting duplicates or skipping records. If an infinite query's results are ever removed from the cache, the pagination restarts at the initial state with only the initial group being requested.

## What if I need to pass custom information to my query function?

By default, the info returned from `getFetchMore` will be supplied to the query function, but in some cases, you may want to override this. You can pass custom variables to the `fetchMore` function which will override the default info like so:

```js
function Projects() {
  const fetchProjects = (key, cursor = 0) =>
    fetch('/api/projects?cursor=' + cursor)

  const {
    status,
    data,
    isFetching,
    isFetchingMore,
    fetchMore,
    canFetchMore,
  } = useInfiniteQuery('projects', fetchProjects, {
    getFetchMore: (lastGroup, allGroups) => lastGroup.nextCursor,
  })

  // Pass your own custom fetchMoreInfo
  const skipToCursor50 = () => fetchMore(50)
}
```

## What if I want to infinitely load more data in reverse?

Sometimes you may not want to **append** infinitely loaded data, but instead **prepend** it. If this is case, you can use `fetchMore`'s `previous` option, eg.

```js
fetchMore(previousPageVariables, { previous: true })
```

This will ensure the new data is prepended to the data array instead of appended.
