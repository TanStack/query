import { For, Show } from 'solid-js'
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useMatchRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/solid-router'
import { debounce } from '@solid-primitives/scheduled'
import { useIsFetching, useQuery } from '@tanstack/solid-query'
import { contactsQueries } from '../services/contacts/queries'
import type { QueryClient } from '@tanstack/solid-query'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    validateSearch: (search: Record<string, unknown>): { q?: string } => ({
      q: typeof search.q === 'string' && search.q ? search.q : undefined,
    }),
    loaderDeps: ({ search: { q } }) => ({ q }),
    loader: ({ context: { queryClient }, deps: { q } }) =>
      queryClient.query({ ...contactsQueries.list(q), staleTime: 'static' }),
    component: Root,
  },
)

function Root() {
  const search = Route.useSearch()
  const q = () => search().q
  const contactsQuery = useQuery(() => contactsQueries.list(q()))
  const fetchingContacts = useIsFetching(() => ({
    queryKey: contactsQueries.lists(),
  }))
  const searching = () => fetchingContacts() > 0
  const loading = useRouterState({ select: (state) => state.isLoading })
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()

  const debouncedSearch = debounce((value: string) => {
    navigate({ to: '.', search: { q: value || undefined } })
  }, 500)

  return (
    <>
      <div id="sidebar">
        <h1>TanStack Router Contacts</h1>
        <div>
          <form
            id="search-form"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              id="q"
              aria-label="Search contacts"
              placeholder="Search"
              type="search"
              name="q"
              autofocus
              value={q() ?? ''}
              class={searching() ? 'loading' : ''}
              onInput={(event) => debouncedSearch(event.currentTarget.value)}
            />
            <div id="search-spinner" aria-hidden hidden={!searching()} />
            <div class="sr-only" aria-live="polite" />
          </form>
          <Link to="/contacts/new" search={{ q: q() }} class="button">
            New
          </Link>
        </div>
        <nav>
          <Show
            when={contactsQuery.data?.length}
            fallback={
              <p>
                <i>No contacts</i>
              </p>
            }
          >
            <ul>
              <For each={contactsQuery.data}>
                {(contact) => (
                  <li>
                    <Link
                      to="/contacts/$contactId"
                      params={{ contactId: contact.id }}
                      search={{ q: q() }}
                      activeProps={{ class: 'active' }}
                      class={
                        matchRoute({
                          to: '/contacts/$contactId',
                          params: { contactId: contact.id },
                          pending: true,
                        })()
                          ? 'pending'
                          : ''
                      }
                    >
                      <Show
                        when={contact.first || contact.last}
                        fallback={<i>No Name</i>}
                      >
                        {contact.first} {contact.last}
                      </Show>{' '}
                      <Show when={contact.favorite}>
                        <span>★</span>
                      </Show>
                    </Link>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </nav>
      </div>
      <div id="detail" class={loading() ? 'loading' : ''}>
        <Outlet />
      </div>
    </>
  )
}
