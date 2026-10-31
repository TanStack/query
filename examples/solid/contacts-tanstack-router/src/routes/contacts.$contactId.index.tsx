import { Show } from 'solid-js'
import { Link, createFileRoute, useNavigate } from '@tanstack/solid-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import {
  contactsMutations,
  contactsQueries,
} from '../services/contacts/queries'
import type { Contact } from '../services/contacts/types'

export const Route = createFileRoute('/contacts/$contactId/')({
  component: ContactPage,
})

function ContactPage() {
  const params = Route.useParams()
  const search = Route.useSearch()
  const contactQuery = useQuery(() => ({
    ...contactsQueries.detail(params().contactId),
    throwOnError: true,
  }))
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const deleteContact = useMutation(() => ({
    ...contactsMutations.delete(),
    onSuccess: async () => {
      await navigate({ to: '/', search: { q: search().q } })
      await queryClient.invalidateQueries({ queryKey: contactsQueries.all() })
    },
  }))

  return (
    <Show when={contactQuery.data}>
      {(contact) => (
        <div id="contact">
          <div>
            <img src={contact().avatar || undefined} />
          </div>

          <div>
            <h1>
              <Show
                when={contact().first || contact().last}
                fallback={<i>No Name</i>}
              >
                {contact().first} {contact().last}
              </Show>{' '}
              <Favorite contact={contact()} />
            </h1>

            <Show when={contact().twitter}>
              <p>
                <a
                  target="_blank"
                  href={`https://twitter.com/${contact().twitter}`}
                >
                  {contact().twitter}
                </a>
              </p>
            </Show>

            <Show when={contact().notes}>
              <p>{contact().notes}</p>
            </Show>

            <div>
              <Link
                to="/contacts/$contactId/edit"
                params={{ contactId: contact().id }}
                search={{ q: search().q }}
                class="button"
              >
                Edit
              </Link>
              <form
                class="destroy"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (
                    confirm('Please confirm you want to delete this record.')
                  ) {
                    deleteContact.mutate(contact().id)
                  }
                }}
              >
                <button type="submit">Delete</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </Show>
  )
}

function Favorite(props: { contact: Contact }) {
  const queryClient = useQueryClient()
  const updateContact = useMutation(() => ({
    ...contactsMutations.update(),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: contactsQueries.all() }),
  }))
  const favorite = () =>
    updateContact.isPending
      ? Boolean(updateContact.variables.updates.favorite)
      : props.contact.favorite

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        updateContact.mutate({
          id: props.contact.id,
          updates: { favorite: !favorite() },
        })
      }}
    >
      <button
        name="favorite"
        value={favorite() ? 'false' : 'true'}
        title={favorite() ? 'Remove from favorites' : 'Add to favorites'}
      >
        {favorite() ? '★' : '☆'}
      </button>
    </form>
  )
}
