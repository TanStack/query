'use client'

import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Todo } from '@/app/api/todos/data'
import { addTodo, todosQueryOptions } from '@/app/todos'

interface MutationContext {
  previousTodos: Array<Todo> | undefined
  optimisticId: string
}

export default function TodoListCache() {
  const queryClient = useQueryClient()
  const [inputValue, setInputValue] = useState('')
  const [lastError, setLastError] = useState<string | null>(null)

  const { data: todos = [] } = useQuery(todosQueryOptions)

  const addTodoMutation = useMutation<Todo, Error, string, MutationContext>({
    mutationFn: addTodo,
    onMutate: async (text) => {
      setLastError(null)
      await queryClient.cancelQueries({ queryKey: todosQueryOptions.queryKey })

      const previousTodos = queryClient.getQueryData(todosQueryOptions.queryKey)

      const optimisticId = `optimistic-${Date.now()}`
      const optimisticTodo: Todo = {
        id: optimisticId,
        text,
        createdAt: Date.now(),
      }

      queryClient.setQueryData(todosQueryOptions.queryKey, (old = []) => [
        ...old,
        optimisticTodo,
      ])

      return { previousTodos, optimisticId }
    },
    onError: (_err, _text, context) => {
      setLastError(_err.message)
      if (context?.previousTodos !== undefined) {
        queryClient.setQueryData(
          todosQueryOptions.queryKey,
          context.previousTodos,
        )
      } else if (context?.optimisticId) {
        queryClient.setQueryData(todosQueryOptions.queryKey, (old = []) =>
          old.filter((todo) => todo.id !== context.optimisticId),
        )
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: todosQueryOptions.queryKey }),
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
        <strong>Approach 2 — via cache manipulation:</strong>{' '}
        <code>onMutate</code> snapshots the cache and writes the optimistic item
        in. <code>onError</code> restores the snapshot on failure.
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
