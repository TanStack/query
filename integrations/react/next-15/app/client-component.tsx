'use client'

import { Temporal } from '@js-temporal/polyfill'
import {
  isError,
  isPending,
  useQuery,
  queryOptions,
} from '@tanstack/react-query'
import React from 'react'

export function ClientComponent() {
  const query = useQuery(
    queryOptions({
      queryKey: ['data'],
      queryFn: async () => {
        const { count } = await (
          await fetch('http://localhost:3000/count')
        ).json()

        return {
          text: 'data from client',
          date: Temporal.PlainDate.from('2023-01-01'),
          count,
        }
      },
    }),
  )

  if (isPending(query)) {
    return <div>Loading...</div>
  }

  if (isError(query)) {
    return <div>An error has occurred!</div>
  }

  return (
    <div>
      {query.data.text} - {query.data.date.toJSON()} - {query.data.count}
    </div>
  )
}
