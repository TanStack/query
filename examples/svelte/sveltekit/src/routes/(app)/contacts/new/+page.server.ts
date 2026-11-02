import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'
import { createContact } from '$lib/server/contacts'

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData()
    const contact = await createContact({
      first: String(formData.get('first') ?? ''),
      last: String(formData.get('last') ?? ''),
      twitter: String(formData.get('twitter') ?? ''),
      avatar: String(formData.get('avatar') ?? ''),
      notes: String(formData.get('notes') ?? ''),
    })
    redirect(303, `/contacts/${contact.id}`)
  },
} satisfies Actions
