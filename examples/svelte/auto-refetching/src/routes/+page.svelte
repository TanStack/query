<script lang="ts">
  import {
    useQueryClient,
    createQuery,
    createMutation,
  } from '@tanstack/svelte-query'

  let intervalMs = $state(1000)
  let value = $state<string>('')

  const client = useQueryClient()

  const endpoint = 'http://localhost:5173/api/data'

  const todos = createQuery<{ items: string[] }>(() => ({
    queryKey: ['refetch'],
    queryFn: async () => await fetch(endpoint).then((r) => r.json()),
    // Refetch the data every second
    refetchInterval: intervalMs,
  }))

  const addMutation = createMutation(() => ({
    mutationFn: (value: string) =>
      fetch(`${endpoint}?add=${value}`).then((r) => r.json()),
    onSuccess: () => client.invalidateQueries({ queryKey: ['refetch'] }),
  }))

  const clearMutation = createMutation(() => ({
    mutationFn: () => fetch(`${endpoint}?clear=1`).then((r) => r.json()),
    onSuccess: () => client.invalidateQueries({ queryKey: ['refetch'] }),
  }))
</script>

<h1>Auto Refetch with stale-time set to 1s</h1>

<p>
  This example is best experienced on your own machine, where you can open
  multiple tabs to the same localhost server and see your changes propagate
  between the two.
</p>

<label>
  Query Interval speed (ms):{' '}
  <div class="flex">
    <input bind:value={intervalMs} type="number" step="100" />{' '}

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
    {#each todos.data.items as item}
      <li>{item}</li>
    {/each}
  </ul>
  <div>
    <button onclick={() => clearMutation.mutate(undefined)}> Clear All </button>
  </div>
{/if}
{#if todos.isFetching}
  <div style="color:darkgreen; font-weight:700">
    'Background Updating...' : ' '
  </div>
{/if}

<style>
  li {
    text-align: left;
  }
</style>
