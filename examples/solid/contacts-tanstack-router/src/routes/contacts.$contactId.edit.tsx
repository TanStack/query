import { Show } from 'solid-js'
import { createFileRoute, useNavigate } from '@tanstack/solid-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import ContactForm from '../contact-form'
import {
  contactsMutations,
  contactsQueries,
} from '../services/contacts/queries'

export const Route = createFileRoute('/contacts/$contactId/edit')({
  component: Edit,
})

function Edit() {
  const params = Route.useParams()
  const search = Route.useSearch()
  const contactQuery = useQuery(() => ({
    ...contactsQueries.detail(params().contactId),
    throwOnError: true,
  }))
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const updateContact = useMutation(() => ({
    ...contactsMutations.update(),
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({ queryKey: contactsQueries.all() })
      await navigate({
        to: '/contacts/$contactId',
        params: { contactId: id },
        search: { q: search().q },
      })
    },
  }))

  return (
    <Show when={contactQuery.data}>
      {(contact) => (
        <ContactForm
          contact={contact()}
          onSubmit={(updates) =>
            updateContact.mutate({ id: contact().id, updates })
          }
        />
      )}
    </Show>
  )
}
