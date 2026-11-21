import { redirect } from '@sveltejs/kit'
import { deleteContact, updateContact } from '$lib/server/contacts'
import type { Actions } from './$types'

export const actions = {
  favorite: async ({ request, params }) => {
    const formData = await request.formData()
    await updateContact(params.contactId, {
      favorite: formData.get('favorite') === 'true',
    })
  },
  destroy: async ({ params }) => {
    await deleteContact(params.contactId)
    redirect(303, '/')
  },
} satisfies Actions
