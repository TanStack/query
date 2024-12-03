'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import * as React from 'react'
import { makeQueryClient } from '@/app/make-query-client'

let queryClientSingleton: QueryClient | undefined
const getQueryClientSingleton = () => {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  }
  return (queryClientSingleton ??= makeQueryClient())
}
export default function Providers({ children }: { children: React.ReactNode }) {
  // const [queryClient] = React.useState(() => makeQueryClient())
  const queryClient = getQueryClientSingleton()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools /> */}
    </QueryClientProvider>
  )
}
