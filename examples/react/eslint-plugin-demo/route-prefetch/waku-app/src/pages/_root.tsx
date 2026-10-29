// ✅ passes: the root only renders the QueryClientProvider; it has no queries of its own.
import { Providers } from '../components/providers'
import type { ReactNode } from 'react'

export default async function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export const getConfig = async () => ({ render: 'dynamic' }) as const
