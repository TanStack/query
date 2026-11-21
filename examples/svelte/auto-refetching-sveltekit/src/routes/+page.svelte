<script lang="ts">
  import {
    useQueryClient,
    createQuery,
    createMutation,
  } from '@tanstack/svelte-query'
  import { todosMutations, todosQueries } from '$lib/services/todos/queries'

  let intervalMs = $state(1000)
  let value = $state<string>('')

  const client = useQueryClient()

  const todos = createQuery(() => ({
    ...todosQueries.list(),
    // Refetch the data every second
    refetchInterval: intervalMs,
  }))

  const addMutation = createMutation(() => ({
    ...todosMutations.create(),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: todosQueries.list().queryKey }),
  }))

  const clearMutation = createMutation(() => ({
    ...todosMutations.deleteAll(),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: todosQueries.list().queryKey }),
  }))
</script>

<h1>Auto Refetch with refetchInterval set to {intervalMs}ms</h1>

<p>
  This example is best experienced on your own machine, where you can open
  multiple tabs to the same localhost server and see your changes propagate
  between the two.
</p>

<label>
  Query Interval speed (ms):
  <div class="flex">
    <input bind:value={intervalMs} type="number" step="100" />

    <span
      style="display:inline-block; 
          margin-left:.5rem;
          width:.75rem;
          height:.75rem; 
          background: {todos.isFetching ? 'green' : 'transparent'};
          transition: {!todos.isFetching ? 'all .3s ease' : 'none'};
          border-radius: 100%;
          transform: scale(1.5)"
    ></span>
  </div>
</label>
<h2>Todo List</h2>
<form
  onsubmit={(e) => {
    e.preventDefault()
    e.stopPropagation()
    addMutation.mutate(value, {
      onSuccess: () => (value = ''),
    })
  }}
>
  <input placeholder="enter something" bind:value />
</form>

{#if todos.isPending}
  Loading...
{/if}
{#if todos.error}
  An error has occurred:
  {todos.error.message}
{/if}
{#if todos.isSuccess}
  <ul>
    {#each todos.data.items as item (item)}
      <li>{item}</li>
    {/each}
  </ul>
  <div>
    <button onclick={() => clearMutation.mutate(undefined)}> Clear All </button>
  </div>
{/if}

<pre
  class={['updating-text', todos.isFetching && 'on']}
  style="font-weight:700">Background Updating...</pre>

<style>
  li {
    text-align: left;
  }

  .updating-text {
    color: transparent;
    transition: all 0.3s ease;
  }
  .updating-text.on {
    color: green;
    transition: none;
  }
</style>
