// @refresh reload
import { Suspense } from 'solid-js'
import {
  A,
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from 'solid-start'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import './root.css'

import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'

export default function Root() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 5000,
      },
    },
  })

  return (
    <Html lang="en">
      <Head>
        <Title>SolidStart - Bare</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <QueryClientProvider client={queryClient}>
          <SolidQueryDevtools />
          <ErrorBoundary>
            <Suspense
              fallback={<div>loading... [root.tsx suspense boundary]</div>}
            >
              <A href="/">Home</A>
              <A href="/streamed">Streamed</A>
              <A href="/deferred">Deferred</A>
              <A href="/mixed">Mixed</A>
              <A href="/with-error">With Error</A>
              <A href="/hydration">Hydration</A>
              <A href="/prefetch">Prefetch</A>

              <Routes>
                <FileRoutes />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </QueryClientProvider>
        <Scripts />
      </Body>
    </Html>
  )
}
