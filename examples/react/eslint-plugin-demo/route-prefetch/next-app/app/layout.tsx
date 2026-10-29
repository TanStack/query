// ✅ passes: the root layout only renders the client-side QueryClientProvider, which runs no queries
import type * as React from 'react'
import Providers from './providers'

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
