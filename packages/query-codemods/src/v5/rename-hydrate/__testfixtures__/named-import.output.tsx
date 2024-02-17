import * as React from 'react'
import {
  HydrationBoundary as RenamedHydrate,
  QueryClient as RenamedQueryClient,
  QueryClientProvider as RenamedQueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export default function MyApp({ Component, pageProps }) {
  const [queryClient] = React.useState(() => new RenamedQueryClient())

  return (
    <RenamedQueryClientProvider client={queryClient}>
      <RenamedHydrate state={pageProps.dehydratedState}>
        <Component {...pageProps} />
      </RenamedHydrate>
      <ReactQueryDevtools />
    </RenamedQueryClientProvider>
  )
}
