<script lang="ts">
  import { createMutation, useQueryClient } from '@tanstack/svelte-query'
  import {
    errorRate,
    queryTimeMin,
    queryTimeMax,
    list,
    id,
  } from '../lib/stores'

  const queryClient = useQueryClient()

  let name = ''

  const postTodo = async ({ name, notes }) => {
    console.info('postTodo', { name, notes })
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < $errorRate) {
          return reject(
            new Error(JSON.stringify({ postTodo: { name, notes } }, null, 2)),
          )
        }
        const todo = { name, notes, id: $id }
        id.set($id + 1)
        list.set([...$list, todo])
        resolve(todo)
      }, $queryTimeMin + Math.random() * ($queryTimeMax - $queryTimeMin))
    })
  }

  const addMutation = createMutation({
    mutationFn: postTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
</script>

<div>
  <input bind:value={name} disabled={$addMutation.status === 'loading'} />

  <button
    on:click={() => $addMutation.mutate({ name })}
    disabled={$addMutation.status === 'loading' || !name}
  >
    Add Todo
  </button>

  <div>
    {$addMutation.status === 'loading'
      ? 'Saving...'
      : $addMutation.status === 'error'
      ? $addMutation.error.message
      : 'Saved!'}
  </div>
</div>
