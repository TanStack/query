---
id: quick-start
title: Quick Start
---

> IMPORTANT: The `@tanstack/marko-query` package is currently experimental. Expect the API and docs to keep evolving. If you use it in production while it is early, pin the package to an exact version and upgrade deliberately.

This snippet shows the three core Marko Query concepts:

- [Queries](./guides/queries.md)
- [Mutations](./guides/mutations.md)
- [Query Invalidation](./guides/query-invalidation.md)

The snippet uses [Marko Run](https://github.com/marko-js/run). Without Marko Run, the tags work the same way. Only the place of the root layout and the server setup change. See [The Query Client](./guides/query-client.md).

First, write a function that creates a `QueryClient`. Marko Query calls it for every client it creates: one per request on the server and one per page in the browser.

```ts
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/marko-query'

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  })
```

Register it once, in the root layout, with `<query-client-factory>`:

```marko
// src/routes/+layout.marko
import { createQueryClient } from "../lib/query-client";

<!doctype html>
<html lang="en">
  <head>
    <title>Todos</title>
  </head>
  <body>
    <query-client-factory factory=createQueryClient/>
    <${input.content}/>
  </body>
</html>
```

Then use the tags in any template:

```marko
// src/routes/todos/+page.marko
import { getQueryClient } from "@tanstack/marko-query";
import { addTodo, getTodos } from "../../lib/api";

<query/todos options=() => ({ queryKey: ["todos"], queryFn: getTodos })/>
<mutation/createTodo options=() => ({
  mutationFn: addTodo,
  onSuccess: () =>
    getQueryClient($global).invalidateQueries({ queryKey: ["todos"] }),
})/>

<if=todos.isPending>
  <p>Loading...</p>
</if>
<else-if=todos.isError>
  <p>Error: ${todos.error.message}</p>
</else-if>
<else>
  <ul>
    <for|todo| of=todos.data by="id">
      <li>${todo.title}</li>
    </for>
  </ul>
</else>

<button
  disabled=createTodo.isPending
  onClick() {
    createTodo.mutate({ title: "Write Marko docs" });
  }
>
  Add Todo
</button>
```

The `<query>` tag returns the query result through its tag variable, `todos`. The `<mutation>` tag returns the mutation result with `mutate`. When the mutation succeeds, `invalidateQueries` marks the `["todos"]` query stale, and the `<query>` tag refetches it.

On the server, `<query>` does not fetch. This page renders "Loading..." on the server, and the browser fetches the todos. To render the todos on the server, prefetch them in the route handler. See [Server Rendering & Hydration](./guides/ssr.md).

Continue with [Tags vs Hooks](./guides/tags-vs-hooks.md) for a mapping from hooks to tags, or go straight to [Queries](./guides/queries.md).
