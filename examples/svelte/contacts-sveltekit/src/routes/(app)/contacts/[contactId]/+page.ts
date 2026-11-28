import { error } from '@sveltejs/kit'
import { query } from '@tanstack/svelte-query'
import { contactsQueries } from '$lib/services/contacts/queries'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, fetch, params }) => {
  const { queryClient } = await parent()
  try {
    await query(queryClient, {
      ...contactsQueries.detail(params.contactId, fetch),
      staleTime: 'static',
    })
  } catch {
    error(404, 'Not Found')
  }
  return { contactId: params.contactId }
}
