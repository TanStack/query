<script lang="ts">
  import ContactForm from '$lib/ContactForm.svelte'
  import { contactsQueries } from '$lib/services/contacts/queries'
  import { createQuery } from '@tanstack/svelte-query'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  const contactQuery = createQuery(() => contactsQueries.detail(data.contactId))
</script>

{#if contactQuery.data}
  <ContactForm contact={contactQuery.data} />
{/if}
