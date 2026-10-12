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

  let { id }: { id: number } = $props()

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

  function patchTodo(todo: Todo): Promise<Todo> {
    console.info('patchTodo', todo)
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.random() < errorRate.value) {
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
    queryKey: ['todo', { id }],
    queryFn: () => fetchTodoById({ id }),
  }))

  let draft = $state<Partial<Omit<Todo, 'id'>>>({})

  const saveMutation = createMutation(() => ({
    mutationFn: patchTodo,
    onSuccess: (data) => {
      // Update `todos` and the individual todo queries when this mutation succeeds
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.setQueryData(['todo', { id }], data)
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
      Name:{' '}
      <input
        value={draft.name ?? todo.name}
        oninput={(e) => (draft.name = e.currentTarget.value)}
        disabled={disableEditSave}
      />
    </label>
    <label>
      Notes:{' '}
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
