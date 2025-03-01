---
id: overview
title: Overview
---

The `@tanstack/svelte-query` package offers a 1st-class API for using TanStack Query via Svelte.

## Example

Include the QueryClientProvider near the root of your project:

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

  const query = createQuery({
    queryKey: ['todos'],
    queryFn: () => fetchTodos(),
  })
</script>

<div>
  {#if $query.isLoading}
    <p>Loading...</p>
  {:else if $query.isError}
    <p>Error: {$query.error.message}</p>
  {:else if $query.isSuccess}
    {#each $query.data as todo}
      <p>{todo.title}</p>
    {/each}
  {/if}
</div>
```

## SvelteKit

If you are using SvelteKit, please have a look at [SSR & SvelteKit](../ssr).

## Available Functions

Svelte Query offers useful functions and components that will make managing server state in Svelte apps easier.

- `createQuery`
- `createQueries`
- `createInfiniteQuery`
- `createMutation`
- `useQueryClient`
- `useIsFetching`
- `useIsMutating`
- `useHydrate`
- `<QueryClientProvider>`
- `<HydrationBoundary>`

## Important Differences between Svelte Query & React Query

Svelte Query offers an API similar to React Query, but there are some key differences to be mindful of.

- Many of the functions in Svelte Query return a Svelte store. To access values on these stores reactively, you need to prefix the store with a `$`. You can learn more about Svelte stores [here](https://learn.svelte.dev/tutorial/writable-stores).
- If your query or mutation depends on variables, you must use a store for the options. You can read more about this [here](../reactivity).
