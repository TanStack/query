'use client'

import React, { useState } from 'react'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { todosMutations, todosQueries } from '../services/todos/queries'

export default function TodoListUI() {
  const queryClient = useQueryClient()
  const [inputValue, setInputValue] = useState('')

  const { data: todos } = useSuspenseQuery(todosQueries.list())

  const addTodoMutation = useMutation({
    ...todosMutations.create(),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: todosQueries.list().queryKey }),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text) return
    addTodoMutation.mutate(text)
    setInputValue('')
  }

  return (
    <div>
      <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '1rem' }}>
        <strong>Approach 1 — via UI variables:</strong> The pending item is
        rendered directly from <code>mutation.variables</code>. No cache
        manipulation needed. On error the pending item simply disappears.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}
      >
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="New todo…"
          style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '1rem' }}
        />
        <button type="submit" disabled={addTodoMutation.isPending}>
          Add
        </button>
      </form>

      {addTodoMutation.isError && (
        <p style={{ color: 'red', marginBottom: '0.5rem' }}>
          {addTodoMutation.error.message}
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{ padding: '0.4rem 0', borderBottom: '1px solid #eee' }}
          >
            {todo.text}
          </li>
        ))}
        {addTodoMutation.isPending && (
          <li
            style={{
              padding: '0.4rem 0',
              borderBottom: '1px solid #eee',
              opacity: 0.5,
            }}
          >
            {addTodoMutation.variables} <em>(saving…)</em>
          </li>
        )}
      </ul>
    </div>
  )
}
