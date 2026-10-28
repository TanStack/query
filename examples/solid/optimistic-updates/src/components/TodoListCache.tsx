import { For, Show, createSignal } from 'solid-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import type { Todo } from '~/services/todos/types'
import type { JSX } from 'solid-js'
import { todosMutations, todosQueries } from '~/services/todos/queries'

interface MutationContext {
  previousTodos: Array<Todo> | undefined
  optimisticId: string
}

export default function TodoListCache() {
  const queryClient = useQueryClient()
  const [inputValue, setInputValue] = createSignal('')
  const [lastError, setLastError] = createSignal<string | null>(null)

  const todosQuery = useQuery(() => todosQueries.list())

  const addTodoMutation = useMutation<Todo, Error, string, MutationContext>(
    () => ({
      ...todosMutations.create(),
      onMutate: async (text) => {
        setLastError(null)
        await queryClient.cancelQueries({
          queryKey: todosQueries.list().queryKey,
        })

        const previousTodos = queryClient.getQueryData(
          todosQueries.list().queryKey,
        )

        const optimisticId = `optimistic-${Date.now()}`
        const optimisticTodo: Todo = {
          id: optimisticId,
          text,
          createdAt: Date.now(),
        }

        queryClient.setQueryData(todosQueries.list().queryKey, (old = []) => [
          ...old,
          optimisticTodo,
        ])

        return { previousTodos, optimisticId }
      },
      onError: (_err, _text, context) => {
        setLastError(_err.message)
        if (context?.previousTodos !== undefined) {
          queryClient.setQueryData(
            todosQueries.list().queryKey,
            context.previousTodos,
          )
        } else if (context?.optimisticId) {
          queryClient.setQueryData(todosQueries.list().queryKey, (old = []) =>
            old.filter((todo) => todo.id !== context.optimisticId),
          )
        }
      },
      onSettled: () =>
        queryClient.invalidateQueries({
          queryKey: todosQueries.list().queryKey,
        }),
    }),
  )

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (e) => {
    e.preventDefault()
    const text = inputValue().trim()
    if (!text) return
    addTodoMutation.mutate(text)
    setInputValue('')
  }

  return (
    <div>
      <p
        style={{
          'font-size': '0.875rem',
          color: '#555',
          'margin-bottom': '1rem',
        }}
      >
        <strong>Approach 2 — via cache manipulation:</strong>{' '}
        <code>onMutate</code> snapshots the cache and writes the optimistic item
        in. <code>onError</code> restores the snapshot on failure.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', gap: '8px', 'margin-bottom': '1rem' }}
      >
        <input
          value={inputValue()}
          onInput={(e) => setInputValue(e.currentTarget.value)}
          placeholder="New todo…"
          style={{ flex: 1, padding: '0.4rem 0.6rem', 'font-size': '1rem' }}
        />
        <button type="submit" disabled={addTodoMutation.isPending}>
          Add
        </button>
      </form>

      <Show when={lastError()}>
        <p style={{ color: 'red', 'margin-bottom': '0.5rem' }}>{lastError()}</p>
      </Show>

      <ul style={{ 'list-style': 'none', padding: 0 }}>
        <For each={todosQuery.data}>
          {(todo) => (
            <li
              style={{
                padding: '0.4rem 0',
                'border-bottom': '1px solid #eee',
                opacity: todo.id.startsWith('optimistic-') ? 0.5 : 1,
              }}
            >
              {todo.text}
              <Show when={todo.id.startsWith('optimistic-')}>
                <em> (saving…)</em>
              </Show>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}
