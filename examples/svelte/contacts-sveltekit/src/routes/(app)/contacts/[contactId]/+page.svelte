<script lang="ts">
  import { enhance } from '$app/forms'
  import { resolve } from '$app/paths'
  import { contactsQueries } from '$lib/services/contacts/queries'
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  const queryClient = useQueryClient()
  const contactQuery = createQuery(() => contactsQueries.detail(data.contactId))

  let pendingFavorite = $state<boolean | null>(null)
  const favorite = $derived(pendingFavorite ?? contactQuery.data?.favorite)
</script>

{#if contactQuery.data}
  {@const contact = contactQuery.data}
  <div id="contact">
    <div>
      <img src={contact.avatar || undefined} alt="" />
    </div>

    <div>
      <h1>
        {#if contact.first || contact.last}
          {contact.first} {contact.last}
        {:else}
          <i>No Name</i>
        {/if}
        <form
          method="POST"
          action="?/favorite"
          use:enhance={({ formData }) => {
            pendingFavorite = formData.get('favorite') === 'true'
            return async ({ update }) => {
              await queryClient.invalidateQueries({
                queryKey: contactsQueries.all(),
              })
              await update()
              pendingFavorite = null
            }
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
      </h1>

      {#if contact.twitter}
        <p>
          <a target="_blank" href="https://twitter.com/{contact.twitter}">
            {contact.twitter}
          </a>
        </p>
      {/if}

      {#if contact.notes}
        <p>{contact.notes}</p>
      {/if}

      <div>
        <a
          href={resolve('/(app)/contacts/[contactId]/edit', {
            contactId: contact.id,
          })}
          class="button"
        >
          Edit
        </a>
        <form
          method="POST"
          action="?/destroy"
          use:enhance={({ cancel }) => {
            if (!confirm('Please confirm you want to delete this record.')) {
              cancel()
            }
            return async ({ update }) => {
              void queryClient.invalidateQueries({
                queryKey: contactsQueries.all(),
              })
              await update()
            }
          }}
        >
          <button type="submit">Delete</button>
        </form>
      </div>
    </div>
  </div>
{/if}
