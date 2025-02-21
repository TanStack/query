'use client'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import Link from 'next/link'
import React from 'react'
import { Temporal } from '@js-temporal/polyfill'
import { getApiV1ActivitiesOptions, getApiV1AuthorsOptions } from './query'

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

export const Activities = () => {
  const { data: activities } = useSuspenseQuery({
    ...getApiV1ActivitiesOptions(),
  })

  return (
    <div className="grid gap-8">
      <Link href="/authors">Authors</Link>
      <pre>{JSON.stringify(activities, null, 2)}</pre>
    </div>
  )
}

export const Authors = () => {
  const { data: authors } = useSuspenseQuery({
    ...getApiV1AuthorsOptions(),
  })

  return (
    <div className="grid gap-8">
      <Link href="/">Activities</Link>
      <pre>{JSON.stringify(authors, null, 2)}</pre>
    </div>
  )
}
