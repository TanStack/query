import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useMatchRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useDebounce } from 'rooks'
import { useIsFetching, useSuspenseQuery } from '@tanstack/react-query'
import { contactsQueries } from '../services/contacts/queries'
import type { QueryClient } from '@tanstack/react-query'

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
  const { q } = Route.useSearch()
  const { data: contacts } = useSuspenseQuery(contactsQueries.list(q))
  const searching = useIsFetching({ queryKey: contactsQueries.lists() }) > 0
  const loading = useRouterState({ select: (state) => state.isLoading })
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()

  const debouncedSearch = useDebounce((value: string) => {
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
            onSubmit={(event) => {
              event.preventDefault()
            }}
          >
            <input
              id="q"
              aria-label="Search contacts"
              placeholder="Search"
              type="search"
              name="q"
              key={q}
              autoFocus
              defaultValue={q}
              className={searching ? 'loading' : ''}
              onChange={(event) => {
                debouncedSearch(event.currentTarget.value)
              }}
            />
            <div id="search-spinner" aria-hidden hidden={!searching} />
            <div className="sr-only" aria-live="polite"></div>
          </form>
          <Link to="/contacts/new" search={{ q }} className="button">
            New
          </Link>
        </div>
        <nav>
          {contacts.length ? (
            <ul>
              {contacts.map((contact) => (
                <li key={contact.id}>
                  <Link
                    to="/contacts/$contactId"
                    params={{ contactId: contact.id }}
                    search={{ q }}
                    activeProps={{ className: 'active' }}
                    className={
                      matchRoute({
                        to: '/contacts/$contactId',
                        params: { contactId: contact.id },
                        pending: true,
                      })
                        ? 'pending'
                        : ''
                    }
                  >
                    {contact.first || contact.last ? (
                      <>
                        {contact.first} {contact.last}
                      </>
                    ) : (
                      <i>No Name</i>
                    )}{' '}
                    {contact.favorite && <span>★</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              <i>No contacts</i>
            </p>
          )}
        </nav>
      </div>
      <div id="detail" className={loading ? 'loading' : ''}>
        <Outlet />
      </div>
    </>
  )
}
