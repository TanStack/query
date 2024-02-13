import { ActionFunctionArgs, redirect } from 'react-router-dom'
import { deleteContact } from '../contacts'
import { QueryClient } from '@tanstack/react-query'

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
