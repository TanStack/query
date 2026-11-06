import { Show } from 'solid-js'
import { action, redirect, useNavigate, useParams } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { queryClient } from '../queryClient'
import { contactsAPI } from '../services/contacts/api'
import { contactsQueries } from '../services/contacts/queries'
import type { Action } from '@solidjs/router'
import type { Contact } from '../services/contacts/types'

export const editContact = action(
  async (contactId: string, formData: FormData) => {
    const updates = Object.fromEntries(formData)
    await contactsAPI.updateContact(contactId, updates)
    queryClient.invalidateQueries({ queryKey: contactsQueries.all() })
    throw redirect(`/contacts/${contactId}`)
  },
  'editContact',
)

export default function Edit() {
  const params = useParams<{ contactId: string }>()
  const contactQuery = useQuery(() => ({
    ...contactsQueries.detail(params.contactId),
    throwOnError: true,
  }))

  return (
    <Show when={contactQuery.data}>
      {(contact) => (
        <ContactForm
          action={editContact.with(contact().id)}
          contact={contact()}
        />
      )}
    </Show>
  )
}

export function ContactForm(props: {
  action: Action<[formData: FormData], never, unknown>
  contact?: Contact
}) {
  const navigate = useNavigate()

  return (
    <form method="post" action={props.action} id="contact-form">
      <p>
        <span>Name</span>
        <input
          placeholder="First"
          aria-label="First name"
          type="text"
          name="first"
          value={props.contact?.first ?? ''}
        />
        <input
          placeholder="Last"
          aria-label="Last name"
          type="text"
          name="last"
          value={props.contact?.last ?? ''}
        />
      </p>
      <label>
        <span>Twitter</span>
        <input
          type="text"
          name="twitter"
          placeholder="@jack"
          value={props.contact?.twitter ?? ''}
        />
      </label>
      <label>
        <span>Avatar URL</span>
        <input
          placeholder="https://example.com/avatar.jpg"
          type="text"
          name="avatar"
          value={props.contact?.avatar ?? ''}
        />
      </label>
      <label>
        <span>Notes</span>
        <textarea name="notes" value={props.contact?.notes ?? ''} rows={6} />
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
    </form>
  )
}
