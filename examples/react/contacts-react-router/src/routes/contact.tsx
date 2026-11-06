import { Form, Link, useFetcher, useLoaderData } from 'react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { contactsAPI } from '../services/contacts/api'
import { contactsQueries } from '../services/contacts/queries'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import type { Contact } from '../services/contacts/types'
import type { QueryClient } from '@tanstack/react-query'

export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    if (!params.contactId) {
      throw new Error('No contact ID provided')
    }
    await queryClient.query({
      ...contactsQueries.detail(params.contactId),
      staleTime: 'static',
    })
    return { contactId: params.contactId }
  }

export const action =
  (queryClient: QueryClient) =>
  async ({ request, params }: ActionFunctionArgs) => {
    const formData = await request.formData()
    if (!params.contactId) {
      throw new Error('No contact ID provided')
    }
    await contactsAPI.updateContact(params.contactId, {
      favorite: formData.get('favorite') === 'true',
    })
    await queryClient.invalidateQueries({ queryKey: contactsQueries.all() })
    return null
  }

export default function Contact() {
  const { contactId } = useLoaderData<ReturnType<typeof loader>>()
  const { data: contact } = useSuspenseQuery(contactsQueries.detail(contactId))

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
          <Link to="edit" className="button">
            Edit
          </Link>
          <Form
            method="post"
            action="destroy"
            onSubmit={(event) => {
              if (!confirm('Please confirm you want to delete this record.')) {
                event.preventDefault()
              }
            }}
          >
            <button type="submit">Delete</button>
          </Form>
        </div>
      </div>
    </div>
  )
}

function Favorite({ contact }: { contact: Contact }) {
  const fetcher = useFetcher({ key: `contact:${contact.id}` })
  let favorite = contact.favorite
  if (fetcher.formData) {
    favorite = fetcher.formData.get('favorite') === 'true'
  }

  return (
    <fetcher.Form method="post">
      <button
        name="favorite"
        value={favorite ? 'false' : 'true'}
        title={favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {favorite ? '★' : '☆'}
      </button>
    </fetcher.Form>
  )
}
