import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Head from 'next/head'
import React from 'react'
import type { AppProps } from 'next/app'

export default function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>
          TanStack React Query Auto Refetching Example (Next.js Pages Router)
        </title>
      </Head>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}
