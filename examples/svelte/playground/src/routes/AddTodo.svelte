<script lang="ts">
  import { createMutation, useQueryClient } from '@tanstack/svelte-query'
  import { todosMutations, todosQueries } from '$lib/services/todos/queries'

  const queryClient = useQueryClient()

  let name = $state('')

  const addMutation = createMutation(() => ({
    ...todosMutations.create(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todosQueries.lists() })
    },
  }))
</script>

<div>
  <input bind:value={name} disabled={addMutation.status === 'pending'} />

  <button
    onclick={() => addMutation.mutate({ name, notes: name })}
    disabled={addMutation.status === 'pending' || !name}
  >
    Add Todo
  </button>

  <div>
    {addMutation.status === 'pending'
      ? 'Saving...'
      : addMutation.status === 'error'
        ? addMutation.error.message
        : addMutation.status === 'success'
          ? 'Saved!'
          : null}
  </div>
</div>
