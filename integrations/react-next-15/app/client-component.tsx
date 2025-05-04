'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Temporal } from '@js-temporal/polyfill'

export function ClientComponent() {
  const query = useQuery({
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
  })

  if (query.isPending) {
    return <div>Loading...</div>
  }

  if (query.isError) {
    return <div>An error has occurred!</div>
  }

  return (
    <div>
      {query.data.text} - {query.data.date.toJSON()} - {query.data.count}
    </div>
  )
}
