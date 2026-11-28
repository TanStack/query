import { query } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { contactsQueries } from '../services/contacts/queries'

export const Route = createFileRoute('/contacts/$contactId')({
  loader: ({ context: { queryClient }, params: { contactId } }) =>
    query(queryClient, {
      ...contactsQueries.detail(contactId),
      staleTime: 'static',
    }),
})
