import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import {
  contactsMutations,
  contactsQueries,
} from '../services/contacts/queries'
import type { Contact } from '../services/contacts/types'

export const Route = createFileRoute('/contacts/$contactId/')({
  component: ContactPage,
})

function ContactPage() {
  const { contactId } = Route.useParams()
  const { q } = Route.useSearch()
  const { data: contact } = useSuspenseQuery(contactsQueries.detail(contactId))
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const deleteContact = useMutation({
    ...contactsMutations.delete(),
    onSuccess: async () => {
      await navigate({ to: '/', search: { q } })
      await queryClient.invalidateQueries({ queryKey: contactsQueries.all() })
    },
  })

  return (
    <div id="contact">
      <div>
        <img key={contact.avatar} src={contact.avatar || undefined} />
      </div>

      <div>
        <h1>
          {contact.first || contact.last ? (
            <>
              {contact.first} {contact.last}
            </>
          ) : (
            <i>No Name</i>
          )}{' '}
          <Favorite contact={contact} />
        </h1>

        {contact.twitter && (
          <p>
            <a target="_blank" href={`https://twitter.com/${contact.twitter}`}>
              {contact.twitter}
            </a>
          </p>
        )}

        {contact.notes && <p>{contact.notes}</p>}

        <div>
          <Link
            to="/contacts/$contactId/edit"
            params={{ contactId }}
            search={{ q }}
            className="button"
          >
            Edit
          </Link>
          <form
            className="destroy"
            onSubmit={(event) => {
              event.preventDefault()
              if (confirm('Please confirm you want to delete this record.')) {
                deleteContact.mutate(contactId)
              }
            }}
          >
            <button type="submit">Delete</button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Favorite({ contact }: { contact: Contact }) {
  const queryClient = useQueryClient()
  const updateContact = useMutation({
    ...contactsMutations.update(),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: contactsQueries.all() }),
  })
  const favorite = updateContact.isPending
    ? Boolean(updateContact.variables.updates.favorite)
    : contact.favorite

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        updateContact.mutate({
          id: contact.id,
          updates: { favorite: !favorite },
        })
      }}
    >
      <button
        name="favorite"
        value={favorite ? 'false' : 'true'}
        title={favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {favorite ? '★' : '☆'}
      </button>
    </form>
  )
}
