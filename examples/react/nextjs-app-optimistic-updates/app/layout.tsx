import Providers from './providers'
import type React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TanStack React Query Optimistic Updates Example',
  description: 'Next.js App Router example with optimistic updates',
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
