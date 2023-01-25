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
  } from '../lib/stores'

  const queryClient = useQueryClient()

  const fetchTodoById = async ({ id }: { id: number }) => {
    console.info('fetchTodoById', { id })
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < $errorRate) {
          return reject(
            new Error(JSON.stringify({ fetchTodoById: { id } }, null, 2)),
          )
        }
        resolve($list.find((d) => d.id === id))
      }, $queryTimeMin + Math.random() * ($queryTimeMax - $queryTimeMin))
    })
  }

  function patchTodo(todo) {
    console.info('patchTodo', todo)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < $errorRate) {
          return reject(new Error(JSON.stringify({ patchTodo: todo }, null, 2)))
        }
        list.set(
          $list.map((d) => {
            if (d.id === todo.id) {
              return todo
            }
            return d
          }),
        )
        resolve(todo)
      }, $queryTimeMin + Math.random() * ($queryTimeMax - $queryTimeMin))
    })
  }

  const query = createQuery({
    queryKey: ['todo', { id: $editingIndex }],
    queryFn: () => fetchTodoById({ id: $editingIndex || 0 }),
    enabled: $editingIndex !== null,
  })

  const saveMutation = createMutation({
    mutationFn: patchTodo,
    onSuccess: (data) => {
      // Update `todos` and the individual todo queries when this mutation succeeds
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.setQueryData(['todo', { id: editingIndex }], data)
    },
  })

  $: todo = $query.data

  const onSave = () => {
    $saveMutation.mutate(todo)
  }

  $: disableEditSave =
    $query.status === 'loading' || $saveMutation.status === 'loading'
</script>

<div>
  <div>
    {#if $query.data}
      <button on:click={() => editingIndex.set(null)}>Back</button> Editing Todo
      "{$query.data.name}" (#{$editingIndex})
    {/if}
  </div>
  {#if $query.status === 'loading'}
    <span>Loading... (Attempt: {$query.failureCount + 1})</span>
  {:else if $query.error}
    <span>
      Error! <button on:click={() => $query.refetch()}>Retry</button>
    </span>
  {:else}
    <label>
      Name:{' '}
      <input bind:value={todo.name} disabled={disableEditSave} />
    </label>
    <label>
      Notes:{' '}
      <input bind:value={todo.notes} disabled={disableEditSave} />
    </label>
    <div>
      <button on:click={onSave} disabled={disableEditSave}> Save </button>
    </div>
    <div>
      {$saveMutation.status === 'loading'
        ? 'Saving...'
        : $saveMutation.status === 'error'
        ? $saveMutation.error.message
        : 'Saved!'}
    </div>
    <div>
      {#if $query.isFetching}
        <span>
          Background Refreshing... (Attempt: {$query.failureCount + 1})
        </span>
      {:else}
        <span>&nbsp;</span>
      {/if}
    </div>
  {/if}
</div>
