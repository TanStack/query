<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query'
import TodosList from './TodosList.svelte'
import EditTodo from './EditTodo.svelte'
import AddTodo from './AddTodo.svelte'
import { views, editingIndex } from '../lib/stores'

const queryClient = useQueryClient()
</script>

<div>
  <div>
    <button on:click={() => queryClient.invalidateQueries()}>
      Force Refetch All
    </button>
  </div>
  <br />
  <hr />

  {#each $views as view}
    <div>
      <TodosList initialFilter={view} />
      <br />
    </div>
  {/each}

  <button
    on:click={() => {
      views.set([...$views, ''])
    }}
  >
    Add Filter List
  </button>
  <hr />

  {#if $editingIndex !== null}
    <EditTodo />
    <hr />
  {/if}

  <AddTodo />
</div>
