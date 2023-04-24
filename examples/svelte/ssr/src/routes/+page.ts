import { getPosts } from '$lib/data'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, fetch }) => {
  const { queryClient } = await parent()

  await queryClient.prefetchQuery({
    queryKey: ['posts', 10],
    queryFn: () => getPosts(10, fetch),
  })
}
