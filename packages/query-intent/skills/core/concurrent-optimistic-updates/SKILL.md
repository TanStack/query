---
name: core/concurrent-optimistic-updates
description: >
  Use this when multiple optimistic mutations can overlap: mutation variables,
  submittedAt keys, scoped mutationKey filters, isMutating guards, cancellation,
  rollback context, filtered list updates, and avoiding windows of inconsistent
  UI during concurrent writes.
type: core
library: TanStack Query
library_version: "5.101.0"
requires:
  - core/implement-optimistic-updates-and-cache-writes
  - core/cancel-queries-and-consume-abort-signals
sources:
  - https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query
  - TanStack/query:docs/framework/react/guides/optimistic-updates.md
  - TanStack/query:docs/framework/react/reference/useMutationState.md
---

## Core Patterns

Concurrent optimistic updates need per-mutation identity and scoped invalidation. A rollback or invalidation from one mutation should not erase another mutation that is still pending.

### Scope related mutations

```tsx
const mutation = useMutation({
  mutationKey: ['items'],
  mutationFn: toggleItem,
  onMutate: async ({ id }) => {
    await queryClient.cancelQueries({ queryKey: ['items', 'detail', id] })
    const previousItem = queryClient.getQueryData<Item>(['items', 'detail', id])

    queryClient.setQueryData<Item>(['items', 'detail', id], (item) =>
      item ? { ...item, isActive: !item.isActive } : item,
    )

    return { previousItem }
  },
  onError: (_error, variables, context) => {
    queryClient.setQueryData(['items', 'detail', variables.id], context?.previousItem)
  },
  onSettled: () => {
    if (queryClient.isMutating({ mutationKey: ['items'] }) === 1) {
      return queryClient.invalidateQueries({ queryKey: ['items'] })
    }
  },
})
```

Use `queryClient.isMutating()` imperatively inside the callback so the count is current at the moment invalidation would run.

### Render pending variables with stable keys

```tsx
const pendingAdds = useMutationState<string>({
  filters: { mutationKey: ['todos', 'add'], status: 'pending' },
  select: (mutation) => `${mutation.state.submittedAt}:${mutation.state.variables}`,
})
```

`submittedAt` distinguishes multiple pending mutations with the same variables.

## Common Mistakes

### CRITICAL One mutation invalidation reverts another optimistic update

Wrong:

```ts
onSettled: () => queryClient.invalidateQueries({ queryKey: ['items'] })
```

Correct:

```ts
onSettled: () => {
  if (queryClient.isMutating({ mutationKey: ['items'] }) === 1) {
    return queryClient.invalidateQueries({ queryKey: ['items'] })
  }
}
```

Skip intermediate invalidations while related optimistic mutations are still in flight.

Source: https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query

### HIGH Optimistic list update ignores current filters

Wrong:

```ts
queryClient.setQueryData(['items', 'list', filters], (items) =>
  items?.map((item) => (item.id === updated.id ? updated : item)),
)
```

Correct:

```ts
queryClient.setQueryData(['items', 'list', filters], (items) =>
  items
    ?.map((item) => (item.id === updated.id ? updated : item))
    .filter((item) => matchesFilters(item, filters)),
)
```

If the server would remove the updated item from the filtered list, the optimistic cache update should do the same.

Source: https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query

### HIGH Pending optimistic rows share unstable keys

Wrong:

```tsx
{variables.map((title) => <li key={title}>{title}</li>)}
```

Correct:

```tsx
const pending = useMutationState({
  filters: { mutationKey: ['todos', 'add'], status: 'pending' },
  select: (mutation) => ({ variables: mutation.state.variables, submittedAt: mutation.state.submittedAt }),
})

{pending.map((todo) => <li key={todo.submittedAt}>{todo.variables.title}</li>)}
```

Use mutation metadata to keep concurrent optimistic rows distinct.

Source: TanStack/query:docs/framework/react/guides/optimistic-updates.md

