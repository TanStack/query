---
id: quick-start
title: Quick Start
---

The `@tanstack/svelte-query` package offers a 1st-class API for using TanStack Query via Svelte.

## Example

```svelte
<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import Example from './lib/Example.svelte'

  const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  <Example />
</QueryClientProvider>
```

Then call any function (e.g. createQuery) from any component:

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const query = createQuery(() => ({
    queryKey: ['todos'],
    queryFn: () => fetchTodos(),
  }))
</script>

<div>
  {#if query.isPending}
    <p>Loading...</p>
  {:else if query.isError}
    <p>Error: {query.error.message}</p>
  {:else if query.isSuccess}
    {#each query.data as todo}
      <p>{todo.title}</p>
    {/each}
  {/if}
</div>
```

## Important Differences between Svelte Query & React Query

Svelte Query offers an API similar to React Query, but there are some key differences to be mindful of.

- Arguments to `svelte-query` primitives (like `createQuery`, `createMutation`) are functions, so that they can be tracked in a reactive scope.

```ts
// ❌ react version
useQuery({
  queryKey: ['todos', todo],
  queryFn: fetchTodos,
})

// ✅ svelte version
createQuery(() => ({
  queryKey: ['todos', todo],
  queryFn: fetchTodos,
}))
```

- Svelte Query primitives do not support destructuring. The return value from these functions is a proxy, and their properties are dynamically resolved.

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const query = createQuery(() => ({
    queryKey: ['repoData'],
    queryFn: () =>
      fetch('https://api.github.com/repos/tannerlinsley/react-query').then(
        (res) => res.json(),
      ),
  }))
</script>

  <!-- ❌ react version -- supports destructuring outside reactive context
  const { isPending, error, data } = useQuery({
    queryKey: ['repoData'],
    queryFn: () =>
      fetch('https://api.github.com/repos/tannerlinsley/react-query').then(
        (res) => res.json(),
      ),
  }) -->

<!-- ✅ access query properties in svelte reactive context -->
<div>
  {#if query.isPending}
    <p>Loading...</p>
  {:else if query.isError}
    <p>Error: {query.error.message}</p>
  {:else if query.isSuccess}
  <div>
    <h1>{query.data.name}</h1>
    <p>{query.data.description}</p>
    <strong>👀 {query.data.subscribers_count}</strong>
    <strong>✨ {query.data.stargazers_count}</strong>
    <strong>🍴 {query.data.forks_count}</strong>
  </div>
  {/if}
</div>
```

- Runes values can be passed in directly to function arguments. Svelte Query will update the query automatically.

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  let enabled = $state(false);
  let todoCount = $state(0);

  // ✅ passing a rune directly is safe and observers update
  // automatically when the value of a rune changes
  const todosQuery = createQuery(() => ({
    queryKey: ['todos'],
    queryFn: () => fetchTodos(),
    enabled: enabled,
  }))

  const todoDetailsQuery = createQuery(() => ({
    queryKey: ['todo', todoCount],
    queryFn: fetchTodo,
    enabled: todoCount > 0,
  }))
</script>

<div>
  {#if todosQuery.isPending}
    <p>Loading...</p>
  {:else if todosQuery.isError}
    <p>Error: {todosQuery.error.message}</p>
  {:else if todosQuery.isSuccess}
    {#each todosQuery.data as todo}
      <button onclick={() => (todoCount = todo.id)}>{todo.title}</button>
    {/each}    
  {/if}
  <button onclick={() => (enabled = !enabled)}>Toggle enabled</button>
</div>
```

- Errors can be caught and reset using Svelte's native `<svelte:boundary>` component.
  Set `throwOnError` option to `true` to make sure errors are thrown to the `<svelte:boundary>` component.

- Since property tracking is handled through Svelte's fine-grained reactivity, options like `notifyOnChangeProps` are not needed
