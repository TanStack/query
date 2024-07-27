<script lang="ts">
  import { useQueryClient } from '@tanstack/svelte-query'
  import TodosList from './TodosList.svelte'
  import EditTodo from './EditTodo.svelte'
  import AddTodo from './AddTodo.svelte'
  import { views, editingIndex } from '../lib/stores.svelte'

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

  {#each views.value as view}
    <div>
      <TodosList initialFilter={view} />
      <br />
    </div>
  {/each}

  <button
    onclick={() => {
      views.value = [...views.value, '']
    }}
  >
    Add Filter List
  </button>
  <hr />

  {#if editingIndex.value !== null}
    <EditTodo />
    <hr />
  {/if}

  <AddTodo />
</div>
