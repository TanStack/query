import { useRouter } from '@tanstack/solid-router'
import type { Contact } from './services/contacts/types'

export type ContactFormValues = Pick<
  Contact,
  'first' | 'last' | 'twitter' | 'avatar' | 'notes'
>

export default function ContactForm(props: {
  contact?: Contact
  onSubmit: (values: ContactFormValues) => void
}) {
  const router = useRouter()

  return (
    <form
      id="contact-form"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        props.onSubmit({
          first: String(formData.get('first')),
          last: String(formData.get('last')),
          twitter: String(formData.get('twitter')),
          avatar: String(formData.get('avatar')),
          notes: String(formData.get('notes')),
        })
      }}
    >
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
            router.history.back()
          }}
        >
          Cancel
        </button>
      </p>
    </form>
  )
}
