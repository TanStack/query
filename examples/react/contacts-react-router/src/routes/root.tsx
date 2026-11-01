import {
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useNavigation,
  useSubmit,
} from 'react-router'
import { useDebounce } from 'rooks'
import { useIsFetching, useSuspenseQuery } from '@tanstack/react-query'
import { contactsQueries } from '../services/contacts/queries'
import type { QueryClient } from '@tanstack/react-query'
import type { LoaderFunctionArgs } from 'react-router'

export const loader =
  (queryClient: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q') ?? ''
    await queryClient.query({ ...contactsQueries.list(q), staleTime: 'static' })
    return { q }
  }

export default function Root() {
  const { q } = useLoaderData<ReturnType<typeof loader>>()
  const { data: contacts } = useSuspenseQuery(contactsQueries.list(q))
  const searching = useIsFetching({ queryKey: contactsQueries.lists() }) > 0
  const navigation = useNavigation()
  const submit = useSubmit()

  const debouncedSubmit = useDebounce(submit, 500)

  return (
    <>
      <div id="sidebar">
        <h1>React Router Contacts</h1>
        <div>
          <form id="search-form" role="search">
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
                debouncedSubmit(event.currentTarget.form)
              }}
            />
            <div id="search-spinner" aria-hidden hidden={!searching} />
            <div className="sr-only" aria-live="polite"></div>
          </form>
          <Link to="contacts/new" className="button">
            New
          </Link>
        </div>
        <nav>
          {contacts.length ? (
            <ul>
              {contacts.map((contact) => (
                <li key={contact.id}>
                  <NavLink
                    to={`contacts/${contact.id}`}
                    className={({ isActive, isPending }) =>
                      isActive ? 'active' : isPending ? 'pending' : ''
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
                  </NavLink>
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
      <div
        id="detail"
        className={navigation.state === 'loading' ? 'loading' : ''}
      >
        <Outlet />
      </div>
    </>
  )
}
