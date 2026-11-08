---
id: infinite-queries
title: Infinite Queries
---

Infinite queries are for lists that load more data into one cache entry. Use the `<infinite-query>` tag.

An infinite query result contains:

- `data.pages`: fetched pages
- `data.pageParams`: page parameters used for those pages
- `fetchNextPage` and `fetchPreviousPage`
- `hasNextPage` and `hasPreviousPage`
- `isFetchingNextPage` and `isFetchingPreviousPage`

## Load More Example

```marko
<infinite-query/projects options=() => ({
  queryKey: ["projects"],
  queryFn: ({ pageParam }) => fetchProjectsPage(pageParam),
  initialPageParam: 1,
  getNextPageParam: (lastPage) =>
    lastPage.hasMore ? lastPage.page + 1 : undefined,
})/>

<if=projects.isPending>
  <p>Loading...</p>
</if>
<else-if=projects.isError>
  <p>Error: ${projects.error.message}</p>
</else-if>
<else>
  <for|page| of=projects.data.pages>
    <for|project| of=page.projects by="id">
      <p>${project.name}</p>
    </for>
  </for>

  <button
    disabled=(!projects.hasNextPage || projects.isFetching)
    onClick() {
      projects.fetchNextPage();
    }
  >
    ${projects.isFetchingNextPage
      ? "Loading more..."
      : projects.hasNextPage
        ? "Load More"
        : "Nothing more to load"}
  </button>
</else>
```

## Page Parameters

`initialPageParam` is required. `getNextPageParam` decides whether another page exists and what value should be passed as `pageParam` to the next query function call.

```marko
<infinite-query/projects options=() => ({
  queryKey: ["projects"],
  queryFn: ({ pageParam }) => fetchProjectsPage(pageParam),
  initialPageParam: 1,
  getNextPageParam: (lastPage) =>
    lastPage.hasMore ? lastPage.page + 1 : undefined,
})/>
```

Returning `undefined` or `null` means there is no next page.

To prefetch an infinite query on the server, use `infiniteQuery` instead of `query`. See [Server Rendering & Hydration](./ssr.md).

## Avoid Overlapping Fetches

There is one ongoing fetch for an infinite query cache entry. If you call `fetchNextPage` while a background refetch is running, you can overwrite data. Disable the button or check `!projects.isFetching` before loading more:

```marko
<button onClick() {
  if (projects.hasNextPage && !projects.isFetching) {
    projects.fetchNextPage();
  }
}>
  Load More
</button>
```

## Paginated Alternative

If your UI shows one page at a time, a normal `<query>` with the page in the key can be a better fit. Use `placeholderData: keepPreviousData` to keep the previous page visible while the next one loads:

```marko
import { keepPreviousData } from "@tanstack/marko-query";

<let/page=1>
<query/projects options=() => ({
  queryKey: ["projects", page],
  queryFn: () => fetchProjects(page),
  placeholderData: keepPreviousData,
})/>

<button onClick() { page++ }>Next page</button>
```
