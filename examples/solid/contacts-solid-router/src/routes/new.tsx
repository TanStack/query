import { action, redirect } from '@solidjs/router'
import { queryClient } from '../queryClient'
import { contactsAPI } from '../services/contacts/api'
import { contactsQueries } from '../services/contacts/queries'
import { ContactForm } from './edit'

export const newContact = action(async (formData: FormData) => {
  const data = Object.fromEntries(formData)
  const contact = await contactsAPI.createContact(data as any)
  queryClient.invalidateQueries({ queryKey: contactsQueries.lists() })
  throw redirect(`/contacts/${contact.id}`)
}, 'newContact')

export default function New() {
  return <ContactForm action={newContact} />
}
