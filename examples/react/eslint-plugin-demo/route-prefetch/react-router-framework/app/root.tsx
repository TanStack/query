// ✅ passes: the root route renders the layout and runs no queries, so there's nothing to prefetch.
import { QueryClientProvider } from '@tanstack/react-query'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import type { ReactNode } from 'react'
import { queryClient } from './queries'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  )
}
