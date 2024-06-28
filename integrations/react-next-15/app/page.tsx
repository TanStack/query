import React from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Temporal } from '@js-temporal/polyfill'
import { ClientComponent } from './client-component'
import { makeQueryClient, tson } from './make-query-client'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default async function Home() {
  const queryClient = makeQueryClient()

  void queryClient.prefetchQuery({
    queryKey: ['data'],
    queryFn: async () => {
      await sleep(2000)
      return {
        text: 'data from server',
        date: Temporal.PlainDate.from('2024-01-01'),
      }
    },
  })

  return (
    <main>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientComponent />
      </HydrationBoundary>
    </main>
  )
}
