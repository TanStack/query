<script lang="ts">
  import { enhance } from '$app/forms'
  import { contactsQueries } from '$lib/services/contacts/queries'
  import { useQueryClient } from '@tanstack/svelte-query'
  import type { Contact } from '$lib/services/contacts/types'

  type Props = {
    contact?: Contact
  }

  let { contact }: Props = $props()

  const queryClient = useQueryClient()
</script>

<form
  method="POST"
  id="contact-form"
  use:enhance={() => {
    return async ({ update }) => {
      void queryClient.invalidateQueries({ queryKey: contactsQueries.all() })
      await update()
    }
  }}
>
  <p>
    <span>Name</span>
    <input
      placeholder="First"
      aria-label="First name"
      type="text"
      name="first"
      value={contact?.first ?? ''}
    />
    <input
      placeholder="Last"
      aria-label="Last name"
      type="text"
      name="last"
      value={contact?.last ?? ''}
    />
  </p>
  <label>
    <span>Twitter</span>
    <input
      type="text"
      name="twitter"
      placeholder="@jack"
      value={contact?.twitter ?? ''}
    />
  </label>
  <label>
    <span>Avatar URL</span>
    <input
      placeholder="https://example.com/avatar.jpg"
      type="text"
      name="avatar"
      value={contact?.avatar ?? ''}
    />
  </label>
  <label>
    <span>Notes</span>
    <textarea name="notes" value={contact?.notes ?? ''} rows={6}></textarea>
  </label>
  <p>
    <button type="submit">Save</button>
    <button type="button" onclick={() => history.back()}>Cancel</button>
  </p>
</form>
