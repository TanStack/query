import React from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '@/app/get-query-client'
import { getTodos } from '@/app/api/todos/route'
import ApproachTabs from '@/components/ApproachTabs'

export default function Home() {
  const queryClient = getQueryClient()

  void queryClient.prefetchQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
  })

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>Optimistic Updates with TanStack Query</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Add todos to see optimistic updates in action. The server randomly fails
        ~30% of the time so you can observe automatic rollback.
      </p>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ApproachTabs />
      </HydrationBoundary>
    </main>
  )
}
