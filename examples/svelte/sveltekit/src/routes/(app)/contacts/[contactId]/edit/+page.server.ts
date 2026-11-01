import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'
import { updateContact } from '$lib/server/contacts'

export const actions = {
  default: async ({ request, params }) => {
    const formData = await request.formData()
    await updateContact(params.contactId, {
      first: String(formData.get('first') ?? ''),
      last: String(formData.get('last') ?? ''),
      twitter: String(formData.get('twitter') ?? ''),
      avatar: String(formData.get('avatar') ?? ''),
      notes: String(formData.get('notes') ?? ''),
    })
    redirect(303, `/contacts/${params.contactId}`)
  },
} satisfies Actions
