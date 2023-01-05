---
id: overview
title: Svelte Query
---

The `@tanstack/svelte-query` package offers a 1st-class API for using TanStack Query via Svelte.

## Example

```
<script lang="ts">
  import { setQueryClient, useQuery } from '@tanstack/svelte-query'

  setQueryClient()

  const query = useQuery({
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

## Available Functions

Svelte Query offers useful primitives and functions that will make managing server state in Svelte apps easier.

- `setQueryClient`
- `useQueryClient`
- `useQuery`
- `useQueries`
- `useMutation`
- `useInfiniteQuery`
- `useHydrate`
- `useIsFetching`
- `useIsMutating`

## Important Differences between Svelte Query & React Query

Svelte Query offers an API similar to React Query, but there are some key differences to be mindful of.

- Svelte Query does not use a provider to initialise the query client. Instead, you call `setQueryClient()` in the root file of your project (e.g. `src/App.svelte`).
- Many of the functions in Svelte Query return a Svelte store. To access values on these stores reactively, you need to prefix the store with a `$`. You can learn more about Svelte stores [here](https://svelte.dev/tutorial/writable-stores).
