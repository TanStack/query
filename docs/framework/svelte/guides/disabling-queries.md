---
id: disabling-queries
title: Disabling/Pausing Queries
ref: docs/framework/react/guides/disabling-queries.md
replace: { 'useQuery': 'createQuery' }
---

[//]: # 'Example'

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const todosQuery = createQuery(() => ({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
    enabled: false,
  }))
</script>

<div>
  <button onclick={() => todosQuery.refetch()}>Fetch Todos</button>

  {#if todosQuery.data}
    <ul>
      {#each todosQuery.data as todo}
        <li>{todo.title}</li>
      {/each}
    </ul>
  {:else if todosQuery.isError}
    <span>Error: {todosQuery.error.message}</span>
  {:else if todosQuery.isLoading}
    <span>Loading...</span>
  {:else}
    <span>Not ready ...</span>
  {/if}
  <div>{todosQuery.isFetching ? 'Fetching...' : null}</div>
</div>
```

[//]: # 'Example'
[//]: # 'Example2'

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  let filter = $state('');

  const todosQuery = createQuery(() => ({
    queryKey: ['todos', filter],
    queryFn: () => fetchTodos(filter),
    // ⬇️ disabled as long as the filter is empty
    enabled: !!filter,
  }))
</script>

<div>
  {/* 🚀 applying the filter will enable and execute the query */}
  <FiltersForm onApply={(value)=>{
    filter = value;
  }} />
  {#if todosQuery.data}
    <TodosTable data={todosQuery.data} />
  {/if}
</div>
```

[//]: # 'Example2'
[//]: # 'Example3'

```svelte
<script lang="ts">
  import { skipToken, createQuery } from '@tanstack/svelte-query'

  let filter = $state<string | undefined>()

  const todosQuery = createQuery(() => ({
    queryKey: ['todos', filter],
    // ⬇️ disabled as long as the filter is undefined or empty
    queryFn: filter ? () => fetchTodos(filter!) : skipToken,
  }))
</script>

<div>
  {/* 🚀 applying the filter will enable and execute the query */}
  <FiltersForm onApply={(value)=>{
    filter = value;
  }} />
  {#if todosQuery.data}
    <TodosTable data={todosQuery.data} />
 {/if}
</div>
```

[//]: # 'Example3'
