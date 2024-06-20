import {
  Form,
  useLoaderData,
  redirect,
  useNavigate,
  ActionFunctionArgs,
} from 'react-router-dom'

import { Contact, updateContact } from '../contacts'
import { QueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { contactDetailQuery, loader } from './contact'

export const action =
  (queryClient: QueryClient) =>
  async ({ request, params }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const updates = Object.fromEntries(formData)
    if (!params.contactId) {
      throw new Error('No contact ID provided')
    }
    await updateContact(params.contactId, updates)
    queryClient.invalidateQueries({ queryKey: ['contacts'] })
    return redirect(`/contacts/${params.contactId}`)
  }

export default function Edit() {
  const { contactId } = useLoaderData() as Awaited<
    ReturnType<ReturnType<typeof loader>>
  >
  const { data: contact } = useSuspenseQuery(contactDetailQuery(contactId))

  return <ContactForm contact={contact} />
}

export function ContactForm({ contact }: { contact?: Contact }) {
  const navigate = useNavigate()

  return (
    <Form method="post" id="contact-form">
      <p>
        <span>Name</span>
        <input
          placeholder="First"
          aria-label="First name"
          type="text"
          name="first"
          defaultValue={contact?.first}
        />
        <input
          placeholder="Last"
          aria-label="Last name"
          type="text"
          name="last"
          defaultValue={contact?.last}
        />
      </p>
      <label>
        <span>Twitter</span>
        <input
          type="text"
          name="twitter"
          placeholder="@jack"
          defaultValue={contact?.twitter}
        />
      </label>
      <label>
        <span>Avatar URL</span>
        <input
          placeholder="https://example.com/avatar.jpg"
          type="text"
          name="avatar"
          defaultValue={contact?.avatar}
        />
      </label>
      <label>
        <span>Notes</span>
        <textarea name="notes" defaultValue={contact?.notes} rows={6} />
      </label>
      <p>
        <button type="submit">Save</button>
        <button
          type="button"
          onClick={() => {
            navigate(-1)
          }}
        >
          Cancel
        </button>
      </p>
    </Form>
  )
}
