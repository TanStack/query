import { dehydrate, QueryClient } from '@tanstack/svelte-query'
import { getPosts, limit } from '$lib/data.js'
import type { PageLoad } from './$types'

export const load: PageLoad = async () => {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['posts', limit],
    queryFn: () => getPosts(limit),
  })

  return {
    dehydratedState: dehydrate(queryClient),
  }
}
