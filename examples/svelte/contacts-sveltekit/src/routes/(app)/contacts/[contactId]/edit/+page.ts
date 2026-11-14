import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'
import { contactsQueries } from '$lib/services/contacts/queries'

export const load: PageLoad = async ({ parent, fetch, params }) => {
  const { queryClient } = await parent()
  try {
    await queryClient.query({
      ...contactsQueries.detail(params.contactId, fetch),
      staleTime: 'static',
    })
  } catch {
    error(404, 'Not Found')
  }
  return { contactId: params.contactId }
}
