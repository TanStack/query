import React from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { makeQueryClient } from '@/app/make-query-client'
import { ClientComponent } from './client-component'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default async function Home() {
  const queryClient = makeQueryClient()

  void queryClient.prefetchQuery({
    queryKey: ['data'],
    queryFn: async () => {
      await sleep(2000)
      return 'data from server'
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
