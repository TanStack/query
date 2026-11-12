import { Providers } from './providers'

export const metadata = {
  title: 'TanStack React Query Suspense Streaming Example',
  description: 'Next.js App Router example with suspense streaming',
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
