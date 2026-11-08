---
id: overview
title: Overview
---

> IMPORTANT: The `@tanstack/marko-query` package is currently experimental. Expect the API and docs to keep evolving. If you use it in production while it is early, pin the package to an exact version and upgrade deliberately.

The `@tanstack/marko-query` package is the Marko adapter for TanStack Query. It gives Marko 6 applications tags for fetching, caching, synchronizing, and updating server state, with server rendering and hydration built in.

TanStack Query manages server state: data that is owned by a remote system, fetched asynchronously, shared across screens, and potentially changed by someone else at any time. It handles caching, request deduplication, stale data, background refetching, mutations, invalidation, pagination, and garbage collection.

Marko Query exposes those features through tags. A tag such as `<query>` subscribes to the `QueryClient` in the browser and returns its current result through a tag variable. The result updates when the cache changes, and the subscription ends when the tag is removed.

## Example

Read a query with the `<query>` tag. The tag variable (`repo` below) holds the query result:

```marko
<query/repo options=() => ({
  queryKey: ["repoData"],
  queryFn: async () => {
    const response = await fetch("https://api.github.com/repos/TanStack/query");
    if (!response.ok) throw new Error("Failed to fetch repo data");
    return response.json() as Promise<{
      name: string;
      description: string;
      stargazers_count: number;
    }>;
  },
})/>

<if=repo.isPending>
  <p>Loading...</p>
</if>
<else-if=repo.isError>
  <p>Error: ${repo.error.message}</p>
</else-if>
<else>
  <h1>${repo.data.name}</h1>
  <p>${repo.data.description}</p>
  <strong>${repo.data.stargazers_count} stars</strong>
</else>
```

The Marko compiler finds the tags through the `marko.json` file of the package, so you do not import them. No provider is needed: Marko Query creates the `QueryClient`. See [The Query Client](./guides/query-client.md).

## Available Tags and Functions

Tags:

- `<query>`
- `<queries>`
- `<infinite-query>`
- `<mutation>`
- `<is-fetching>`
- `<is-mutating>`
- `<mutation-state>`
- `<hydration-boundary>`
- `<query-client-factory>`

Functions:

- `getQueryClient`
- `setQueryClient`
- `setQueryClientFactory`
- `isRestoring`
- `setIsRestoring`
- `queryOptions`
- `infiniteQueryOptions`
- `mutationOptions`

Marko Query also re-exports TanStack Query Core from `@tanstack/marko-query`, so `QueryClient`, `dehydrate`, `hydrate`, `keepPreviousData`, and the other core APIs are imported from `@tanstack/marko-query`.

## Behaviors to Know

- Tag inputs such as `options` and `filters` are functions, for example `options=() => todosQuery`. See [Tags vs Hooks](./guides/tags-vs-hooks.md) for why.
- Marko Query creates one client per request on the server and one client per page in the browser, so there is no provider component to render. Use `<query-client-factory>` to configure the clients.
- Query tags do not fetch on the server. To render data on the server, prefetch it before the page renders. See [Server Rendering & Hydration](./guides/ssr.md).
- The result of a tag has no functions other than its methods (`refetch`, `fetchNextPage`, `mutate`, and so on), because Marko serializes the result for the browser.
- Errors are in the result by default. To handle them with `<try>`, set `throwOnError`.

Start with [Installation](./installation.md), then [Quick Start](./quick-start.md).
