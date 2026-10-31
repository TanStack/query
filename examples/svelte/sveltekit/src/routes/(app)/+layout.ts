import type { LayoutLoad } from './$types'
import { contactsQueries } from '$lib/services/contacts/queries'

export const load: LayoutLoad = async ({ parent, fetch, url }) => {
  const { queryClient } = await parent()
  const q = url.searchParams.get('q') ?? ''
  await queryClient.query({
    ...contactsQueries.list(q, fetch),
    staleTime: 'static',
  })
  return { q }
}
