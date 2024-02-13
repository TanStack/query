import { redirect, ActionFunctionArgs } from 'react-router-dom'

import { createContact } from '../contacts'
import { QueryClient } from '@tanstack/react-query'
import { ContactForm } from './edit'

export const action =
  (queryClient: QueryClient) =>
  async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const data = Object.fromEntries(formData)
    const contact = await createContact(data as any)
    queryClient.invalidateQueries({ queryKey: ['contacts', 'list'] })
    return redirect(`/contacts/${contact.id}`)
  }

export default function New() {
  return <ContactForm />
}
