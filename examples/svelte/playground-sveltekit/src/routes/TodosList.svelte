<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { editingIndex } from '$lib/stores.svelte'
  import { todosQueries } from '$lib/services/todos/queries'

  type Props = {
    initialFilter: string
  }

  let { initialFilter: filter }: Props = $props()

  const query = createQuery(() => todosQueries.list(filter))
</script>

<div>
  <label>
    Filter:
    <input bind:value={filter} />
  </label>
</div>

{#if query.status === 'pending'}
  <span>Loading... (Attempt: {query.failureCount + 1})</span>
{:else if query.status === 'error'}
  <span>
    Error: {query.error.message}
    <br />
    <button onclick={() => query.refetch()}>Retry</button>
  </span>
{:else}
  <ul>
    {#if query.data}
      {#each query.data as todo (todo.id)}
        <li>
          {todo.name}
          <button onclick={() => (editingIndex.value = todo.id)}> Edit </button>
        </li>
      {/each}
    {/if}
  </ul>
  <div>
    {#if query.isFetching}
      <span>
        Background Refreshing... (Attempt: {query.failureCount + 1})
      </span>
    {:else}
      <span>&nbsp;</span>
    {/if}
  </div>
{/if}
