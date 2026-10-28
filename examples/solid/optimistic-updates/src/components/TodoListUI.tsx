import { For, Show, createSignal } from 'solid-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import type { JSX } from 'solid-js'
import { todosMutations, todosQueries } from '~/services/todos/queries'

export default function TodoListUI() {
  const queryClient = useQueryClient()
  const [inputValue, setInputValue] = createSignal('')

  const todosQuery = useQuery(() => todosQueries.list())

  const addTodoMutation = useMutation(() => ({
    ...todosMutations.create(),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: todosQueries.list().queryKey }),
  }))

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
        <strong>Approach 1 — via UI variables:</strong> The pending item is
        rendered directly from <code>mutation.variables</code>. No cache
        manipulation needed. On error the pending item simply disappears.
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

      <Show when={addTodoMutation.isError}>
        <p style={{ color: 'red', 'margin-bottom': '0.5rem' }}>
          {addTodoMutation.error?.message}
        </p>
      </Show>

      <ul style={{ 'list-style': 'none', padding: 0 }}>
        <For each={todosQuery.data}>
          {(todo) => (
            <li
              style={{ padding: '0.4rem 0', 'border-bottom': '1px solid #eee' }}
            >
              {todo.text}
            </li>
          )}
        </For>
        <Show when={addTodoMutation.isPending}>
          <li
            style={{
              padding: '0.4rem 0',
              'border-bottom': '1px solid #eee',
              opacity: 0.5,
            }}
          >
            {addTodoMutation.variables} <em>(saving…)</em>
          </li>
        </Show>
      </ul>
    </div>
  )
}
