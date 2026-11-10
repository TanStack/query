---
id: query-invalidation
title: Query Invalidation
---

Waiting for queries to become stale is not always enough. After a mutation succeeds, you often know that related cached data is out of date. Use `invalidateQueries` on the client to mark matching queries stale and refetch the ones that a tag is observing.

Get the client with `getQueryClient($global)`. See [The Query Client](./query-client.md).

```ts
const client = getQueryClient($global)

client.invalidateQueries()

client.invalidateQueries({
  queryKey: ['todos'],
})
```

When a query is invalidated:

- It is marked stale, overriding any `staleTime`
- If a tag is observing the query and the query is enabled, the query refetches in the background
- If every tag that observes the query is disabled (`enabled: false`), the query is marked stale but does not refetch. It refetches when a tag enables it again

## Invalidation from Mutations

```marko
import { getQueryClient } from "@tanstack/marko-query";

<mutation/addTodo options=() => ({
  mutationFn: createTodo,
  onSuccess: () =>
    getQueryClient($global).invalidateQueries({ queryKey: ["todos"] }),
})/>
```

Use this pattern when the mutation result tells you related cached data is stale.

## Query Matching

Match a group of queries by prefix:

```ts
client.invalidateQueries({ queryKey: ['projects'] })
```

Both of these query keys match:

```ts
const projectsListKey = ['projects']
const projectsPageKey = ['projects', 1]
```

Use a more specific key when only one slice should be invalidated:

```ts
client.invalidateQueries({
  queryKey: ['projects', page],
})
```

Use `exact: true` to match only the exact key:

```ts
client.invalidateQueries({
  queryKey: ['projects'],
  exact: true,
})
```

## Manual Cache Updates

Invalidation is usually simpler than normalized cache updates. When you do need immediate UI updates, combine targeted cache writes with invalidation:

```ts
client.setQueryData<Todo[]>(['todos'], (existing) =>
  existing ? [...existing, createdTodo] : existing,
)

await client.invalidateQueries({ queryKey: ['todos'] })
```

For rollback with optimistic updates, see [Side Effects](./mutations.md#side-effects) in the mutation guide.
