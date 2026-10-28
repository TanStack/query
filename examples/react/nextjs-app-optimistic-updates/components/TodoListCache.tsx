'use client'

import React, { useState } from 'react'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { todosMutations, todosQueries } from '../services/todos/queries'
import type { Todo } from '../services/todos/types'

interface MutationContext {
  previousTodos: Array<Todo> | undefined
  optimisticId: string
}

export default function TodoListCache() {
  const queryClient = useQueryClient()
  const [inputValue, setInputValue] = useState('')
  const [lastError, setLastError] = useState<string | null>(null)

  const { data: todos } = useSuspenseQuery(todosQueries.list())

  const addTodoMutation = useMutation<Todo, Error, string, MutationContext>({
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
