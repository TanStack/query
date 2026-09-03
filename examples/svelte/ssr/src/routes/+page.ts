import { noop } from '@tanstack/svelte-query'
import type { PageLoad } from './$types'
import { api } from '$lib/api'

export const load: PageLoad = async ({ parent, fetch }) => {
  const { queryClient } = await parent()

  await queryClient
    .query({
      queryKey: ['posts', 10],
      queryFn: () => api(fetch).getPosts(10),
    })
    .catch(noop)
}
