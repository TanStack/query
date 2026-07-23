# TanStack Query — Next.js App Router Optimistic Updates

This example demonstrates **optimistic updates** with TanStack Query v5 in a Next.js 14 App Router project.

## What it shows

A todo list where items appear in the UI immediately after submission — before the server confirms. The server randomly fails ~30% of the time so you can observe automatic rollback behaviour.

Two approaches are shown side by side via a tab toggle:

### Approach 1 — Via UI Variables (simpler)

Render the pending item directly from `mutation.variables`. No cache touching required. On error, the pending item simply disappears and an error message is shown.

```ts
const mutation = useMutation({ mutationFn: addTodo, onSettled: invalidate })

// In JSX:
{mutation.isPending && <li style={{ opacity: 0.5 }}>{mutation.variables}</li>}
```

**Best when:** the mutation input maps 1-to-1 to what you'd show while pending.

### Approach 2 — Via Cache Manipulation (`onMutate` + rollback)

`onMutate` cancels in-flight refetches, snapshots the current cache, and writes an optimistic item directly into the cache. `onError` restores the snapshot.

```ts
const mutation = useMutation({
  mutationFn: addTodo,
  onMutate: async (text) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])
    queryClient.setQueryData<Todo[]>(['todos'], (old = []) => [...old, optimistic])
    return { previousTodos }
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(['todos'], context?.previousTodos)
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})
```

**Best when:** you need fine-grained control or the optimistic shape differs from `mutation.variables`.

## Running the example

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Learn more

- [TanStack Query — Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Next.js App Router](https://nextjs.org/docs/app)
