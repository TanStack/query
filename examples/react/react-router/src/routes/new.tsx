import { redirect } from 'react-router'

import { contactsAPI } from '../services/contacts/api'
import { contactsQueries } from '../services/contacts/queries'
import { ContactForm } from './edit'
import type { QueryClient } from '@tanstack/react-query'
import type { ActionFunctionArgs } from 'react-router'

export const action =
  (queryClient: QueryClient) =>
  async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const data = Object.fromEntries(formData)
    const contact = await contactsAPI.createContact(data as any)
    queryClient.invalidateQueries({ queryKey: contactsQueries.lists() })
    return redirect(`/contacts/${contact.id}`)
  }

export default function New() {
  return <ContactForm />
}
