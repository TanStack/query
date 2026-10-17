import { redirect } from 'react-router-dom'

import { createContact } from '../contacts'
import { ContactForm } from './edit'
import type { QueryClient } from '@tanstack/react-query'
import type { ActionFunctionArgs } from 'react-router-dom'

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
