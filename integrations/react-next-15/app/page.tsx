import React from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Temporal } from '@js-temporal/polyfill'
import { ClientComponent } from './client-component'
import { makeQueryClient } from './make-query-client'
import { queryExampleAction } from './_action'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function Home() {
  const queryClient = makeQueryClient()

  void queryClient.prefetchQuery({
    queryKey: ['data'],
    queryFn: async () => {
      const { count } = await (
        await fetch('http://localhost:3000/count')
      ).json()

      console.log('server', count)

      return {
        text: 'data from server',
        date: Temporal.PlainDate.from('2024-01-01'),
        count,
      }
    },
  })

  const state = dehydrate(queryClient)

  console.log('[page] state', state)

  return (
    <main>
      <HydrationBoundary state={state}>
        <ClientComponent />
      </HydrationBoundary>
      <form action={queryExampleAction}>
        <button type="submit">Increment</button>
      </form>
    </main>
  )
}
