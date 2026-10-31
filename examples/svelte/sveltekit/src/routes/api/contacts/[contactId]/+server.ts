import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getContact } from '$lib/server/contacts'

export const GET: RequestHandler = async ({ params }) => {
  const contact = await getContact(params.contactId)
  if (!contact) error(404, 'Not Found')
  return json(contact)
}
