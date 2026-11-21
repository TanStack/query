import { createFileRoute } from '@tanstack/solid-router'
import { contactsQueries } from '../services/contacts/queries'

export const Route = createFileRoute('/contacts/$contactId')({
  loader: ({ context: { queryClient }, params: { contactId } }) =>
    queryClient.query({
      ...contactsQueries.detail(contactId),
      staleTime: 'static',
    }),
})
