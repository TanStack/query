import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getContacts } from '$lib/server/contacts'

export const GET: RequestHandler = async ({ url }) => {
  return json(await getContacts(url.searchParams.get('q') ?? ''))
}
