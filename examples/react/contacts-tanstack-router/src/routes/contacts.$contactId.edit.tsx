import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import ContactForm from '../contact-form'
import {
  contactsMutations,
  contactsQueries,
} from '../services/contacts/queries'

export const Route = createFileRoute('/contacts/$contactId/edit')({
  component: Edit,
})

function Edit() {
  const { contactId } = Route.useParams()
  const { q } = Route.useSearch()
  const { data: contact } = useSuspenseQuery(contactsQueries.detail(contactId))
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const updateContact = useMutation({
    ...contactsMutations.update(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contactsQueries.all() })
      await navigate({
        to: '/contacts/$contactId',
        params: { contactId },
        search: { q },
      })
    },
  })

  return (
    <ContactForm
      key={contact.id}
      contact={contact}
      onSubmit={(updates) => updateContact.mutate({ id: contactId, updates })}
    />
  )
}
