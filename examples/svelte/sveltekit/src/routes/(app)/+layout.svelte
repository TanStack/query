<script lang="ts">
  import { resolve } from '$app/paths'
  import { navigating, page } from '$app/state'
  import { contactsQueries } from '$lib/services/contacts/queries'
  import { createQuery, useIsFetching } from '@tanstack/svelte-query'
  import type { LayoutProps } from './$types'

  let { data, children }: LayoutProps = $props()

  const contactsQuery = createQuery(() => contactsQueries.list(data.q))
  const fetchingContacts = useIsFetching({ queryKey: contactsQueries.lists() })

  let searchTimeout: ReturnType<typeof setTimeout> | undefined

  const submitSearch = (form: HTMLFormElement | null) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => form?.requestSubmit(), 500)
  }
</script>

<div id="root">
  <div id="sidebar">
    <h1>SvelteKit Contacts</h1>
    <div>
      <form id="search-form" role="search" data-sveltekit-keepfocus>
        <input
          id="q"
          aria-label="Search contacts"
          placeholder="Search"
          type="search"
          name="q"
          value={data.q}
          class={fetchingContacts.current > 0 ? 'loading' : ''}
          oninput={(event) => submitSearch(event.currentTarget.form)}
        />
        <div
          id="search-spinner"
          aria-hidden="true"
          hidden={fetchingContacts.current === 0}
        ></div>
        <div class="sr-only" aria-live="polite"></div>
      </form>
      <a href={resolve('/contacts/new')} class="button">New</a>
    </div>
    <nav>
      {#if contactsQuery.data?.length}
        <ul>
          {#each contactsQuery.data as contact (contact.id)}
            {@const href = resolve('/(app)/contacts/[contactId]', {
              contactId: contact.id,
            })}
            <li>
              <a {href} class={page.url.pathname === href ? 'active' : ''}>
                {#if contact.first || contact.last}
                  {contact.first} {contact.last}
                {:else}
                  <i>No Name</i>
                {/if}
                {#if contact.favorite}<span>★</span>{/if}
              </a>
            </li>
          {/each}
        </ul>
      {:else}
        <p><i>No contacts</i></p>
      {/if}
    </nav>
  </div>
  <div id="detail" class={navigating.to ? 'loading' : ''}>
    {@render children()}
  </div>
</div>
