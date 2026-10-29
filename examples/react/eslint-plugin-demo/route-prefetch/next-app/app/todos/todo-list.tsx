'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { todosOptions } from '../queries'

export function TodoList() {
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all')
  const { data = [] } = useQuery(todosOptions(filter))

  return (
    <section>
      <select
        value={filter}
        onChange={(event) => setFilter(event.target.value as typeof filter)}
      >
        <option value="all">All</option>
        <option value="open">Open</option>
        <option value="done">Done</option>
      </select>
      <ul>
        {data.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </section>
  )
}
