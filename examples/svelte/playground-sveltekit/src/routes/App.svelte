<script lang="ts">
  import { useQueryClient } from '@tanstack/svelte-query'
  import { views, editingIndex } from '../lib/stores.svelte'
  import AddTodo from './AddTodo.svelte'
  import EditTodo from './EditTodo.svelte'
  import TodosList from './TodosList.svelte'

  const queryClient = useQueryClient()
</script>

<div>
  <div>
    <button onclick={() => queryClient.invalidateQueries()}>
      Force Refetch All
    </button>
  </div>
  <br />
  <hr />

  {#each views.value as view, index (index)}
    <div>
      <TodosList initialFilter={view} />
      <br />
    </div>
  {/each}

  <button
    onclick={() => {
      views.value.push('')
    }}
  >
    Add Filter List
  </button>
  <hr />

  {#if editingIndex.value !== null}
    {#key editingIndex.value}
      <EditTodo id={editingIndex.value} />
    {/key}
    <hr />
  {/if}

  <AddTodo />
</div>
