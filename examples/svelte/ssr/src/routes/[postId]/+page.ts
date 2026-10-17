import { noop } from '@tanstack/svelte-query'
import type { PageLoad } from './$types'
import { postQueryOptions } from '$lib/queries'

export const load: PageLoad = async ({ parent, fetch, params }) => {
  const { queryClient } = await parent()

  const postId = parseInt(params.postId)

  await queryClient.query(postQueryOptions(postId, fetch)).catch(noop)

  return { postId }
}
