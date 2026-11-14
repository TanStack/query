import Providers from './providers'
import type { Metadata } from 'next'
import type React from 'react'

export const metadata: Metadata = {
  title: 'TanStack React Query Prefetching Example (Next.js App Router)',
  description: 'Next.js App Router example with prefetching',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
