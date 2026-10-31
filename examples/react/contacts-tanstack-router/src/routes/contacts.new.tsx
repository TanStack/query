import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
  const { q } = Route.useSearch()
  const createContact = useMutation({
    ...contactsMutations.create(),
    onSuccess: async (contact) => {
      await queryClient.invalidateQueries({
        queryKey: contactsQueries.lists(),
      })
      await navigate({
        to: '/contacts/$contactId',
        params: { contactId: contact.id },
        search: { q },
      })
    },
  })

  return <ContactForm onSubmit={(values) => createContact.mutate(values)} />
}
