<script lang="ts">
  import {
    useQueryClient,
    createQuery,
    createMutation,
  } from '@tanstack/svelte-query'
  import {
    errorRate,
    queryTimeMin,
    queryTimeMax,
    list,
    editingIndex,
  } from '$lib/stores.svelte'
  import type { Todo } from '$lib/stores.svelte'

  const queryClient = useQueryClient()

  const fetchTodoById = async ({ id }: { id: number }): Promise<Todo> => {
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.random() < errorRate.value) {
            return reject(
              new Error(JSON.stringify({ fetchTodoById: { id } }, null, 2)),
            )
          }
          const todo = $state.snapshot(list.value.find((d) => d.id === id))
          if (!todo) {
            return reject(
              new Error(JSON.stringify({ fetchTodoById: { id } }, null, 2)),
            )
          }
          resolve(todo)
        },
        queryTimeMin.value +
          Math.random() * (queryTimeMax.value - queryTimeMin.value),
      )
    })
  }

  function patchTodo(todo?: Todo): Promise<Todo> {
    console.info('patchTodo', todo)
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.random() < errorRate.value) {
            return reject(
              new Error(JSON.stringify({ patchTodo: todo }, null, 2)),
            )
          }
          if (!todo) {
            return reject(
              new Error(JSON.stringify({ patchTodo: todo }, null, 2)),
            )
          }
          list.value = list.value.map((d) => {
            if (d.id === todo.id) {
              return $state.snapshot(todo)
            }
            return d
          })
          resolve(todo)
        },
        queryTimeMin.value +
          Math.random() * (queryTimeMax.value - queryTimeMin.value),
      )
    })
  }

  const query = createQuery(() => ({
    queryKey: ['todo', { id: editingIndex.value }],
    queryFn: () => fetchTodoById({ id: editingIndex.value || 0 }),
    enabled: editingIndex.value !== null,
  }))

  const saveMutation = createMutation(() => ({
    mutationFn: patchTodo,
    onSuccess: (data) => {
      // Update `todos` and the individual todo queries when this mutation succeeds
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.setQueryData(['todo', { id: editingIndex }], data)
    },
  }))

  const todo = $derived(query.data)

  const onSave = () => {
    saveMutation.mutate(todo)
  }

  const disableEditSave = $derived(
    query.status === 'pending' || saveMutation.status === 'pending',
  )
</script>

<div>
  <div>
    {#if query.data}
      <button onclick={() => (editingIndex.value = null)}>Back</button> Editing
      Todo "{query.data.name}" (#{editingIndex.value})
    {/if}
  </div>
  {#if query.status === 'pending'}
    <span>Loading... (Attempt: {query.failureCount + 1})</span>
  {:else if query.error}
    <span>
      Error! <button onclick={() => query.refetch()}>Retry</button>
    </span>
  {:else if todo}
    <label>
      Name:{' '}
      <input bind:value={todo.name} disabled={disableEditSave} />
    </label>
    <label>
      Notes:{' '}
      <input bind:value={todo.notes} disabled={disableEditSave} />
    </label>
    <div>
      <button onclick={onSave} disabled={disableEditSave}> Save </button>
    </div>
    <div>
      {saveMutation.status === 'pending'
        ? 'Saving...'
        : saveMutation.status === 'error'
          ? saveMutation.error.message
          : 'Saved!'}
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
