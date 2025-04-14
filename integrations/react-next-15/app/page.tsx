import { headers } from 'next/headers'
import React, { Suspense } from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Temporal } from '@js-temporal/polyfill'
import { Activities, ClientComponent } from './client-component'
import { makeQueryClient } from './make-query-client'
import { queryExampleAction } from './_action'
import { getApiV1ActivitiesOptions } from './query'

export default function Home() {
  const queryClient = makeQueryClient()

  queryClient.prefetchQuery({
    queryKey: ['data'],
    queryFn: async () => {
      const { count } = await (
        await fetch('http://localhost:3000/count', {
          headers: await headers(),
        })
      ).json()

      return {
        text: 'data from server',
        date: Temporal.PlainDate.from('2024-01-01'),
        count,
      }
    },
  })

  void queryClient.prefetchQuery({ ...getApiV1ActivitiesOptions() })

  const state = dehydrate(queryClient)

  return (
    <main>
      <HydrationBoundary state={state}>
        <ClientComponent />
        <form action={queryExampleAction}>
          <button type="submit">Increment</button>
        </form>
        <Suspense fallback={<div>Loading activities...</div>}>
          <Activities />
        </Suspense>
      </HydrationBoundary>
    </main>
  )
}
