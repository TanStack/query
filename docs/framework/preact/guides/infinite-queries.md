---
id: infinite-queries
title: Infinite Queries
---

Rendering lists that can additively "load more" data onto an existing set of data or "infinite scroll" is also a very common UI pattern. TanStack Query supports a useful version of `useQuery` called `useInfiniteQuery` for querying these types of lists.

When using `useInfiniteQuery`, you'll notice a few things are different:

- `data` is now an object containing infinite query data:
- `data.pages` array containing the fetched pages
- `data.pageParams` array containing the page params used to fetch the pages
- The `fetchNextPage` and `fetchPreviousPage` functions are now available (`fetchNextPage` is required)
- The `initialPageParam` option is now available (and required) to specify the initial page param
- The `getNextPageParam` and `getPreviousPageParam` options are available for both determining if there is more data to load and the information to fetch it. This information is supplied as an additional parameter in the query function
- A `hasNextPage` boolean is now available and is `true` if `getNextPageParam` returns a value other than `null` or `undefined`
- A `hasPreviousPage` boolean is now available and is `true` if `getPreviousPageParam` returns a value other than `null` or `undefined`
- The `isFetchingNextPage` and `isFetchingPreviousPage` booleans are now available to distinguish between a background refresh state and a loading more state

> Note: Options `initialData` or `placeholderData` need to conform to the same structure of an object with `data.pages` and `data.pageParams` properties.

## Example

Let's assume we have an API that returns pages of `projects` 3 at a time based on a `cursor` index along with a cursor that can be used to fetch the next group of projects:

```tsx
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
- Returning the information for the next query in `getNextPageParam`
- Calling `fetchNextPage` function

[//]: # 'Example'

```tsx
import { useInfiniteQuery } from '@tanstack/preact-query'

function Projects() {
  const fetchProjects = async ({ pageParam }) => {
    const res = await fetch('/api/projects?cursor=' + pageParam)
    return res.json()
  }

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  })

  return status === 'pending' ? (
    <p>Loading...</p>
  ) : status === 'error' ? (
    <p>Error: {error.message}</p>
  ) : (
    <>
      {data.pages.map((group, i) => (
        <>
          {group.data.map((project) => (
            <p key={project.id}>{project.name}</p>
          ))}
        </>
      ))}
      <div>
        <button
          onClick={() => fetchNextPage()}
          disabled={!hasNextPage || isFetching}
        >
          {isFetchingNextPage
            ? 'Loading more...'
            : hasNextPage
              ? 'Load More'
              : 'Nothing more to load'}
        </button>
      </div>
      <div>{isFetching && !isFetchingNextPage ? 'Fetching...' : null}</div>
    </>
  )
}
```

[//]: # 'Example'

It's essential to understand that calling `fetchNextPage` while an ongoing fetch is in progress runs the risk of overwriting data refreshes happening in the background. This situation becomes particularly critical when rendering a list and triggering `fetchNextPage` simultaneously.

Remember, there can only be a single ongoing fetch for an InfiniteQuery. A single cache entry is shared for all pages, attempting to fetch twice simultaneously might lead to data overwrites.

If you intend to enable simultaneous fetching, you can utilize the `{ cancelRefetch: false }` option (default: true) within `fetchNextPage`.

To ensure a seamless querying process without conflicts, it's highly recommended to verify that the query is not in an `isFetching` state, especially if the user won't directly control that call.

[//]: # 'Example1'

```jsx
<List onEndReached={() => hasNextPage && !isFetching && fetchNextPage()} />
```

[//]: # 'Example1'

## What happens when an infinite query needs to be refetched?

When an infinite query becomes `stale` and needs to be refetched, each group is fetched `sequentially`, starting from the first one. This ensures that even if the underlying data is mutated, we're not using stale cursors and potentially getting duplicates or skipping records. If an infinite query's results are ever removed from the queryCache, the pagination restarts at the initial state with only the initial group being requested.

## What if I want to implement a bi-directional infinite list?

Bi-directional lists can be implemented by using the `getPreviousPageParam`, `fetchPreviousPage`, `hasPreviousPage` and `isFetchingPreviousPage` properties and functions.

[//]: # 'Example3'

```tsx
useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  initialPageParam: 0,
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage, pages) => firstPage.prevCursor,
})
```

[//]: # 'Example3'

## What if I want to show the pages in reversed order?

Sometimes you may want to show the pages in reversed order. If this is case, you can use the `select` option:

[//]: # 'Example4'

```tsx
useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  select: (data) => ({
    pages: [...data.pages].reverse(),
    pageParams: [...data.pageParams].reverse(),
  }),
})
```

[//]: # 'Example4'

## What if I want to manually update the infinite query?

### Manually removing first page:

[//]: # 'Example5'

```tsx
queryClient.setQueryData(['projects'], (data) => ({
  pages: data.pages.slice(1),
  pageParams: data.pageParams.slice(1),
}))
```

[//]: # 'Example5'

### Manually removing a single value from an individual page:

[//]: # 'Example6'

```tsx
const newPagesArray =
  oldPagesArray?.pages.map((page) =>
    page.filter((val) => val.id !== updatedId),
  ) ?? []

queryClient.setQueryData(['projects'], (data) => ({
  pages: newPagesArray,
  pageParams: data.pageParams,
}))
```

[//]: # 'Example6'

### Keep only the first page:

[//]: # 'Example7'

```tsx
queryClient.setQueryData(['projects'], (data) => ({
  pages: data.pages.slice(0, 1),
  pageParams: data.pageParams.slice(0, 1),
}))
```

[//]: # 'Example7'

Make sure to always keep the same data structure of pages and pageParams!

## What if I want to limit the number of pages?

In some use cases you may want to limit the number of pages stored in the query data to improve the performance and UX:

- when the user can load a large number of pages (memory usage)
- when you have to refetch an infinite query that contains dozens of pages (network usage: all the pages are sequentially fetched)

The solution is to use a "Limited Infinite Query". This is made possible by using the `maxPages` option in conjunction with `getNextPageParam` and `getPreviousPageParam` to allow fetching pages when needed in both directions.

In the following example only 3 pages are kept in the query data pages array. If a refetch is needed, only 3 pages will be refetched sequentially.

[//]: # 'Example8'

```tsx
useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  initialPageParam: 0,
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage, pages) => firstPage.prevCursor,
  maxPages: 3,
})
```

[//]: # 'Example8'

## What if my API doesn't return a cursor?

If your API doesn't return a cursor, you can use the `pageParam` as a cursor. Because `getNextPageParam` and `getPreviousPageParam` also get the `pageParam`of the current page, you can use it to calculate the next / previous page param.

[//]: # 'Example9'

```tsx
return useInfiniteQuery({
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
})
```

[//]: # 'Example9'
[//]: # 'Materials'

## Further reading

To get a better understanding of how Infinite Queries work under the hood, see the article [How Infinite Queries work](https://tkdodo.eu/blog/how-infinite-queries-work).

[//]: # 'Materials'
