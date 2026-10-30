import { redirect } from 'react-router'
import { contactsAPI } from '../services/contacts/api'
import { contactsQueries } from '../services/contacts/queries'
import type { QueryClient } from '@tanstack/react-query'
import type { ActionFunctionArgs } from 'react-router'

export const action =
  (queryClient: QueryClient) =>
  async ({ params }: ActionFunctionArgs) => {
    if (!params.contactId) {
      throw new Error('No contact ID provided')
    }
    await contactsAPI.deleteContact(params.contactId)
    queryClient.invalidateQueries({ queryKey: contactsQueries.all() })
    return redirect('/')
  }
