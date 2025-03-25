<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import {
    errorRate,
    queryTimeMin,
    queryTimeMax,
    list,
    editingIndex,
  } from '$lib/stores.svelte'
  import type { Todos } from '$lib/stores.svelte'

  let { initialFilter }: { initialFilter: string } = $props()

  let filter = $state(initialFilter)

  const fetchTodos = async ({ filter }: { filter: string }): Promise<Todos> => {
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.random() < errorRate.value) {
            return reject(
              new Error(JSON.stringify({ fetchTodos: { filter } }, null, 2)),
            )
          }
          resolve(list.value.filter((d) => d.name.includes(filter)))
        },
        queryTimeMin.value +
          Math.random() * (queryTimeMax.value - queryTimeMin.value),
      )
    })
  }

  const query = createQuery(() => ({
    queryKey: ['todos', { filter: filter }],
    queryFn: () => fetchTodos({ filter: filter }),
  }))
</script>

<div>
  <label>
    Filter:{' '}
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
      {#each query.data as todo}
        <li>
          {todo.name}{' '}
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
