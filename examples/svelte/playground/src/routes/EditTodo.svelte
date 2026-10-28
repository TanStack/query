<script lang="ts">
  import {
    useQueryClient,
    createQuery,
    createMutation,
  } from '@tanstack/svelte-query'
  import { editingIndex } from '$lib/stores.svelte'
  import { todosMutations, todosQueries } from '$lib/services/todos/queries'
  import type { Todo } from '$lib/services/todos/types'

  type Props = {
    id: number
  }

  let { id }: Props = $props()

  const queryClient = useQueryClient()

  const query = createQuery(() => todosQueries.detail(id))

  let draft = $state<Partial<Omit<Todo, 'id'>>>({})

  const saveMutation = createMutation(() => ({
    ...todosMutations.update(),
    onSuccess: (data) => {
      // Update `todos` and the individual todo queries when this mutation succeeds
      queryClient.invalidateQueries({ queryKey: todosQueries.lists() })
      queryClient.setQueryData(todosQueries.detail(id).queryKey, data)
      draft = {}
    },
  }))

  const disableEditSave = $derived(
    query.status === 'pending' || saveMutation.status === 'pending',
  )
</script>

<div>
  <div>
    {#if query.data}
      <button onclick={() => (editingIndex.value = null)}>Back</button> Editing
      Todo "{query.data.name}" (#{id})
    {/if}
  </div>
  {#if query.status === 'pending'}
    <span>Loading... (Attempt: {query.failureCount + 1})</span>
  {:else if query.error}
    <span>
      Error! <button onclick={() => query.refetch()}>Retry</button>
    </span>
  {:else if query.data}
    {@const todo = query.data}
    <label>
      Name:
      <input
        value={draft.name ?? todo.name}
        oninput={(e) => (draft.name = e.currentTarget.value)}
        disabled={disableEditSave}
      />
    </label>
    <label>
      Notes:
      <input
        value={draft.notes ?? todo.notes}
        oninput={(e) => (draft.notes = e.currentTarget.value)}
        disabled={disableEditSave}
      />
    </label>
    <div>
      <button
        onclick={() => saveMutation.mutate({ ...todo, ...draft })}
        disabled={disableEditSave}
      >
        Save
      </button>
    </div>
    <div>
      {saveMutation.status === 'pending'
        ? 'Saving...'
        : saveMutation.status === 'error'
          ? saveMutation.error.message
          : saveMutation.status === 'success'
            ? 'Saved!'
            : null}
    </div>
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
</div>
