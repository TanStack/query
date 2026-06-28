'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Todo } from '@/app/api/todos/route'

interface MutationContext {
  previousTodos: Array<Todo> | undefined
}

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

export default function TodoListCache() {
  const queryClient = useQueryClient()
  const [inputValue, setInputValue] = useState('')
  const [lastError, setLastError] = useState<string | null>(null)

  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  const addTodoMutation = useMutation<Todo, Error, string, MutationContext>({
    mutationFn: addTodo,
    onMutate: async (text) => {
      setLastError(null)
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      const previousTodos = queryClient.getQueryData<Array<Todo>>(['todos'])

      const optimisticTodo: Todo = {
        id: `optimistic-${Date.now()}`,
        text,
        createdAt: Date.now(),
      }

      queryClient.setQueryData<Array<Todo>>(['todos'], (old = []) => [
        ...old,
        optimisticTodo,
      ])

      return { previousTodos }
    },
    onError: (_err, _text, context) => {
      setLastError(_err.message)
      if (context?.previousTodos !== undefined) {
        queryClient.setQueryData(['todos'], context.previousTodos)
      }
    },
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
        <strong>Approach 2 — via cache manipulation:</strong> <code>onMutate</code>{' '}
        snapshots the cache and writes the optimistic item in. <code>onError</code>{' '}
        restores the snapshot on failure.
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

      {lastError && (
        <p style={{ color: 'red', marginBottom: '0.5rem' }}>{lastError}</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              padding: '0.4rem 0',
              borderBottom: '1px solid #eee',
              opacity: todo.id.startsWith('optimistic-') ? 0.5 : 1,
            }}
          >
            {todo.text}
            {todo.id.startsWith('optimistic-') && <em> (saving…)</em>}
          </li>
        ))}
      </ul>
    </div>
  )
}
