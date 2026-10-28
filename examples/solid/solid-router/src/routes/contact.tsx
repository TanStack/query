import { Show } from 'solid-js'
import { A, action, useParams, useSubmission } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { queryClient } from '../queryClient'
import { contactsAPI } from '../services/contacts/api'
import { contactsQueries } from '../services/contacts/queries'
import { destroyContact } from './destroy'
import type { RoutePreloadFuncArgs } from '@solidjs/router'
import type { Contact } from '../services/contacts/types'

export const preload = ({ params }: RoutePreloadFuncArgs) => {
  if (!params.contactId) return
  void queryClient.prefetchQuery(contactsQueries.detail(params.contactId))
}

export const toggleFavorite = action(
  async (contactId: string, formData: FormData) => {
    await contactsAPI.updateContact(contactId, {
      favorite: formData.get('favorite') === 'true',
    })
    await queryClient.invalidateQueries({ queryKey: contactsQueries.all() })
  },
  'toggleFavorite',
)

export default function ContactPage() {
  const params = useParams<{ contactId: string }>()
  const contactQuery = useQuery(() => ({
    ...contactsQueries.detail(params.contactId),
    throwOnError: true,
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
              <A href="edit" class="button">
                Edit
              </A>
              <form
                method="post"
                action={destroyContact.with(contact().id)}
                onSubmit={(event) => {
                  if (
                    !confirm('Please confirm you want to delete this record.')
                  ) {
                    event.preventDefault()
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
  const submission = useSubmission(
    toggleFavorite,
    ([contactId]) => contactId === props.contact.id,
  )
  const favorite = () =>
    submission.pending
      ? submission.input[1].get('favorite') === 'true'
      : props.contact.favorite

  return (
    <form method="post" action={toggleFavorite.with(props.contact.id)}>
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
