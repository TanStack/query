import { query } from '@tanstack/svelte-query'
import { contactsQueries } from '$lib/services/contacts/queries'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ parent, fetch, url }) => {
  const { queryClient } = await parent()
  const q = url.searchParams.get('q') ?? ''
  await query(queryClient, {
    ...contactsQueries.list(q, fetch),
    staleTime: 'static',
  })
  return { q }
}
