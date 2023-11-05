import * as React from 'react'
import {
  Outlet,
  useLoaderData,
  Form,
  NavLink,
  useNavigation,
  useSubmit,
} from 'react-router-dom'
import { useDebounce } from 'rooks'

import { createContact, getContacts } from '../contacts'
import { useQuery, useIsFetching } from '@tanstack/react-query'

const contactListQuery = (q) => ({
  queryKey: ['contacts', 'list', q ?? 'all'],
  queryFn: () => getContacts(q),
})

export const loader =
  (queryClient) =>
  async ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')
    if (!queryClient.getQueryData(contactListQuery(q).queryKey)) {
      await queryClient.fetchQuery(contactListQuery(q))
    }
    return { q }
  }

export const action = (queryClient) => async () => {
  const contact = await createContact()
  queryClient.invalidateQueries({ queryKey: ['contacts', 'list'] })
  return contact
}

export default function Root() {
  const { q } = useLoaderData()
  const { data: contacts } = useQuery(contactListQuery(q))
  const searching = useIsFetching({ queryKey: ['contacts', 'list'] }) > 0
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
          <Form method="post">
            <button type="submit">New</button>
          </Form>
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
