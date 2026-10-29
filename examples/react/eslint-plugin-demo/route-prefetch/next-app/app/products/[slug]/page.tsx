// ✅ passes: productOptions comes from the @/lib/queries barrel via the tsconfig "@/*" alias on both sides
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '@/app/get-query-client'
import { productOptions } from '@/lib/queries'
import { ProductDetails } from './product-details'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(productOptions(slug))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductDetails slug={slug} />
    </HydrationBoundary>
  )
}
