---
id: infinite-queries
title: Infinite Queries
---

Infinite queries are for lists that load more data into one cache entry. Use [`createInfiniteQueryController`](../reference/functions/createInfiniteQueryController.md).

An infinite query result contains:

- `data.pages`: fetched pages
- `data.pageParams`: page parameters used for those pages
- `fetchNextPage` and `fetchPreviousPage`
- `hasNextPage` and `hasPreviousPage`
- `isFetchingNextPage` and `isFetchingPreviousPage`

## Load More Example

```ts
import { LitElement, html } from 'lit'
import { createInfiniteQueryController } from '@tanstack/lit-query'

class ProjectsList extends LitElement {
  private readonly projects = createInfiniteQueryController(this, {
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjectsPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  })

  render() {
    const query = this.projects()

    if (query.isPending) return html`Loading...`
    if (query.isError) return html`Error: ${query.error.message}`

    return html`
      ${query.data.pages.map(
        (page) => html`
          ${page.projects.map((project) => html`<p>${project.name}</p>`)}
        `,
      )}

      <button
        ?disabled=${!query.hasNextPage || query.isFetching}
        @click=${() => this.projects.fetchNextPage()}
      >
        ${query.isFetchingNextPage
          ? 'Loading more...'
          : query.hasNextPage
            ? 'Load More'
            : 'Nothing more to load'}
      </button>
    `
  }
}
```

## Page Parameters

`initialPageParam` is required. `getNextPageParam` decides whether another page exists and what value should be passed as `pageParam` to the next query function call.

```ts
createInfiniteQueryController(this, {
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjectsPage(pageParam),
  initialPageParam: 1,
  getNextPageParam: (lastPage) =>
    lastPage.hasMore ? lastPage.page + 1 : undefined,
})
```

Returning `undefined` or `null` means there is no next page.

## Avoid Overlapping Fetches

There is one ongoing fetch for an infinite query cache entry. If you call `fetchNextPage` while a background refetch is running, you can overwrite data. Disable the button or check `!query.isFetching` before loading more:

```ts
if (query.hasNextPage && !query.isFetching) {
  this.projects.fetchNextPage()
}
```

## Paginated Alternative

If your UI shows one page at a time, a normal query with a page in the key can be a better fit. The [Pagination example](../examples/pagination) uses `createQueryController`, `placeholderData: keepPreviousData`, prefetching, and mutations to demonstrate that pattern.
