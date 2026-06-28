'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Todo } from '@/app/api/todos/route'

async function fetchTodos(): Promise<Array<Todo>> {
  const res = await fetch('/api/todos')
  if (!res.ok) throw new Error('Failed to fetch todos')
  return res.json()
}

async function addTodo(text: string): Promise<Todo> {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    const err = (await res.json()) as { error: string }
    throw new Error(err.error)
  }
  return res.json()
}

export default function TodoListUI() {
  const queryClient = useQueryClient()
  const [inputValue, setInputValue] = useState('')

  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  const addTodoMutation = useMutation({
    mutationFn: addTodo,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
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
          <li key={todo.id} style={{ padding: '0.4rem 0', borderBottom: '1px solid #eee' }}>
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
