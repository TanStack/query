import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import Head from 'next/head'
import React from 'react'
import type { DehydratedState } from '@tanstack/react-query'
import type { AppProps } from 'next/app'

const emptyState: DehydratedState = { queries: [], mutations: [] }

export default function MyApp({
  Component,
  pageProps,
}: AppProps<{ dehydratedState?: DehydratedState }>) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>
          TanStack React Query Hydration Example (Next.js Pages Router)
        </title>
      </Head>
      <HydrationBoundary state={pageProps.dehydratedState ?? emptyState}>
        <Component {...pageProps} />
      </HydrationBoundary>
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
