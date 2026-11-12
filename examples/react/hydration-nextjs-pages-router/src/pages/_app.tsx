import React from 'react'
import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import Head from 'next/head'
import type { AppProps } from 'next/app'

export default function MyApp({ Component, pageProps }: AppProps) {
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
      <HydrationBoundary state={pageProps.dehydratedState}>
        <Component {...pageProps} />
      </HydrationBoundary>
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
