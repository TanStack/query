'use client'

import React, { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Temporal } from '@js-temporal/polyfill'
import { TsonSerialized } from 'tupleson'
import { tson } from './make-query-client'

export function ClientComponent() {
  const query = useQuery({
    queryKey: ['data'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000))
      return {
        text: 'data from client',
        date: Temporal.PlainDate.from('2023-01-01'),
      }
    },
  })

  console.log('client component render', query.data)

  if (query.isPending) {
    return <div>Loading...</div>
  }

  if (query.isError) {
    return <div>An error has occurred!</div>
  }

  return (
    <div>
      {query.data.text} - {query.data.date.toJSON()}
    </div>
  )
}

export function ClientComponent2({
  promise,
}: {
  promise: Promise<TsonSerialized<Date>>
}) {
  const promiseWithTransform = promise.then(tson.deserialize)
  console.log('client component 2 promise', promise)
  console.log('client component 2 promiseWithTransform', promiseWithTransform)
  const date = use(promiseWithTransform)

  console.log('client component 2 render', date)

  return <div>{date.toJSON()}</div>
}
