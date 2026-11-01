<script lang="ts">
  import '../app.css'
  import {
    useQueryClient,
    createQuery,
    createMutation,
  } from '@tanstack/svelte-query'
  import { todosMutations, todosQueries } from '$lib/services/todos/queries'

  let text = $state<string>('')

  const client = useQueryClient()

  const todos = createQuery(() => todosQueries.list())

  const addTodoMutation = createMutation(() => ({
    ...todosMutations.create(),
    onMutate: async (newTodo: string) => {
      text = ''
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await client.cancelQueries({ queryKey: todosQueries.list().queryKey })

      // Snapshot the previous value
      const previousTodos = client.getQueryData(todosQueries.list().queryKey)

      // Optimistically update to the new value
      if (previousTodos) {
        client.setQueryData(todosQueries.list().queryKey, {
          ...previousTodos,
          items: [
            ...previousTodos.items,
            { id: Math.random().toString(), text: newTodo },
          ],
        })
      }

      return { previousTodos }
    },
    // If the mutation fails, use the result returned from onMutate to roll back
    onError: (_err, _variables, onMutateResult) => {
      if (onMutateResult?.previousTodos) {
        client.setQueryData(
          todosQueries.list().queryKey,
          onMutateResult.previousTodos,
        )
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
      client.invalidateQueries({ queryKey: todosQueries.list().queryKey })
    },
  }))
</script>

<h1>Optimistic Updates</h1>
<p>
  In this example, new items can be created using a mutation. The new item will
  be optimistically added to the list in hopes that the server accepts the item.
  If it does, the list is refetched with the true items from the list. Every now
  and then, the mutation may fail though. When that happens, the previous list
  of items is restored and the list is again refetched from the server.
</p>

<form
  onsubmit={(e) => {
    e.preventDefault()
    e.stopPropagation()
    addTodoMutation.mutate(text)
  }}
>
  <div>
    <input type="text" bind:value={text} />
    <button disabled={addTodoMutation.isPending}>Create</button>
  </div>
</form>

{#if todos.isPending}
  Loading...
{/if}
{#if todos.error}
  An error has occurred:
  {todos.error.message}
{/if}
{#if todos.isSuccess}
  <div class="mb-4">
    Updated At: {new Date(todos.data.ts).toLocaleTimeString()}
  </div>
  <ul>
    {#each todos.data.items as todo (todo.id)}
      <li>{todo.text}</li>
    {/each}
  </ul>
{/if}
{#if todos.isFetching}
  <div style="color:darkgreen; font-weight:700">Background Updating...</div>
{/if}

<style>
  li {
    text-align: left;
  }
</style>
