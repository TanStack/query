// ✅ passes: the docs layout prefetches the docs navigation and dehydrates it around {children}.
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../../get-query-client'
import { docsNavOptions } from '../../queries'
import type { LayoutProps } from 'waku/router'

export default async function DocsLayout({ children }: LayoutProps<'/docs'>) {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(docsNavOptions)
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  )
}
