---
id: query-invalidation
title: Query Invalidation
---

Waiting for queries to become stale is not always enough. After a mutation succeeds, you often know that related cached data is out of date. Use `queryClient.invalidateQueries` to mark matching queries stale and refetch active observers.

```ts
queryClient.invalidateQueries()

queryClient.invalidateQueries({
  queryKey: ['todos'],
})
```

When a query is invalidated:

- It is marked stale, overriding any `staleTime`
- If a matching query is active in a controller, it can refetch in the background

## Invalidation from Mutations

```ts
private readonly addTodo = createMutationController(this, {
  mutationFn: addTodo,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

Use this pattern when the mutation result tells you related cached data is stale. The [Pagination example](../examples/pagination) shows invalidation after project mutations.

## Query Matching

Match a group of queries by prefix:

```ts
queryClient.invalidateQueries({ queryKey: ['projects'] })
```

Both of these query keys match:

```ts
const projectsListKey = ['projects']
const projectsPageKey = ['projects', 1, 250, false]
```

Use a more specific key when only one slice should be invalidated:

```ts
queryClient.invalidateQueries({
  queryKey: ['projects', this.page],
})
```

Use `exact: true` to match only the exact key:

```ts
queryClient.invalidateQueries({
  queryKey: ['projects'],
  exact: true,
})
```

## Manual Cache Updates

Invalidation is usually simpler than normalized cache updates. When you do need immediate UI updates, combine targeted cache writes with invalidation:

```ts
queryClient.setQueryData<TodosResponse>(['todos'], (existing) => {
  if (!existing) return existing

  return {
    ...existing,
    items: [...existing.items, createdTodo],
  }
})

await queryClient.invalidateQueries({ queryKey: ['todos'] })
```

For rollback with optimistic updates, see the mutation guide and the [Pagination example](../examples/pagination).
