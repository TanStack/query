'use client'

import React from 'react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Temporal } from '@js-temporal/polyfill'

export function ClientComponent() {
  const query = useSuspenseQuery({
    queryKey: ['data'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000))
      return {
        text: 'data from client',
        date: Temporal.PlainDate.from('2023-01-01'),
      }
    },
  })

  // if (query.isPending) {
  //   return <div>Loading...</div>
  // }

  // if (query.isError) {
  //   return <div>An error has occurred!</div>
  // }

  return (
    <div>
      {query.data.text} - {query.data.date.toJSON()}
    </div>
  )
}
