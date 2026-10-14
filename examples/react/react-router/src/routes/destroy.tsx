import { redirect } from 'react-router-dom'
import { deleteContact } from '../contacts'
import type { QueryClient } from '@tanstack/react-query'
import type { ActionFunctionArgs } from 'react-router-dom'

export const action =
  (queryClient: QueryClient) =>
  async ({ params }: ActionFunctionArgs) => {
    if (!params.contactId) {
      throw new Error('No contact ID provided')
    }
    await deleteContact(params.contactId)
    queryClient.invalidateQueries({ queryKey: ['contacts'] })
    return redirect('/')
  }
