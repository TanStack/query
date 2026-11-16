import { json } from '@sveltejs/kit'
import { getContacts } from '$lib/server/contacts'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  return json(await getContacts(url.searchParams.get('q') ?? ''))
}
