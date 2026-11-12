import Providers from './providers'
import type React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TanStack React Query Prefetching Example',
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
