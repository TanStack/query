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
      // await sleep(1)
      return tson.serialize({
        text: 'data from server',
        date: Temporal.PlainDate.from('2024-01-01'),
      })
    },
  })

  await sleep(10)

  const dehydratedState = dehydrate(queryClient)
  console.log('dehydratedState', JSON.stringify(dehydratedState, null, 4))

  return (
    <main>
      <HydrationBoundary state={dehydratedState}>
        <ClientComponent />
      </HydrationBoundary>
    </main>
  )
}
