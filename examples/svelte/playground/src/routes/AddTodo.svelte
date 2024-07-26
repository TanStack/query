<script lang="ts">
  import { createMutation, useQueryClient } from '@tanstack/svelte-query'
  import {
    errorRate,
    queryTimeMin,
    queryTimeMax,
    list,
    id,
  } from '$lib/stores.svelte'
  import type { Todo } from '$lib/stores.svelte'

  const queryClient = useQueryClient()

  let name = $state('')

  const postTodo = async ({ name, notes }: Omit<Todo, 'id'>) => {
    console.info('postTodo', { name, notes })
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.random() < errorRate.value) {
            return reject(
              new Error(
                JSON.stringify(
                  { postTodo: { name: $state.snapshot(name), notes } },
                  null,
                  2,
                ),
              ),
            )
          }
          const todo = { name, notes, id: id.value }
          id.value = id.value + 1
          list.value = [...list.value, todo]
          resolve(todo)
        },
        queryTimeMin.value +
          Math.random() * (queryTimeMax.value - queryTimeMin.value),
      )
    })
  }

  const addMutation = createMutation(() => ({
    mutationFn: postTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
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
        : 'Saved!'}
  </div>
</div>
