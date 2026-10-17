import { noop } from '@tanstack/svelte-query'
import type { PageLoad } from './$types'
import { postsQueryOptions } from '$lib/queries'

export const load: PageLoad = async ({ parent, fetch }) => {
  const { queryClient } = await parent()

  await queryClient.query(postsQueryOptions(10, fetch)).catch(noop)
}
