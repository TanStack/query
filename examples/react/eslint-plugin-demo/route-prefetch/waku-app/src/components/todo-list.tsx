// ✅ passes: the filter is client state (useState), so the query can't be known on the server and
// isn't reported.
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { todosOptions } from '../queries'

export function TodoList() {
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all')
  const { data: todos = [] } = useQuery(todosOptions(filter))
  return (
    <>
      <select
        value={filter}
        onChange={(event) =>
          setFilter(event.target.value as 'all' | 'open' | 'done')
        }
      >
        <option value="all">All</option>
        <option value="open">Open</option>
        <option value="done">Done</option>
      </select>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </>
  )
}
