import { createFileRoute, useNavigate } from '@tanstack/solid-router'
import { useMutation, useQueryClient } from '@tanstack/solid-query'
import ContactForm from '../contact-form'
import {
  contactsMutations,
  contactsQueries,
} from '../services/contacts/queries'

export const Route = createFileRoute('/contacts/new')({
  component: New,
})

function New() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const createContact = useMutation(() => ({
    ...contactsMutations.create(),
    onSuccess: async (contact) => {
      await queryClient.invalidateQueries({
        queryKey: contactsQueries.lists(),
      })
      await navigate({
        to: '/contacts/$contactId',
        params: { contactId: contact.id },
        search: { q: search().q },
      })
    },
  }))

  return <ContactForm onSubmit={(values) => createContact.mutate(values)} />
}
