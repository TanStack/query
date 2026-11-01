import { ErrorBoundary, For, Show, Suspense } from 'solid-js'
import { A, useIsRouting, useSearchParams } from '@solidjs/router'
import { debounce } from '@solid-primitives/scheduled'
import { noop, useIsFetching, useQuery } from '@tanstack/solid-query'
import ErrorPage from '../error-page'
import { queryClient } from '../queryClient'
import { contactsQueries } from '../services/contacts/queries'
import type { RoutePreloadFuncArgs, RouteSectionProps } from '@solidjs/router'

export const preload = ({ location }: RoutePreloadFuncArgs) => {
  const q = location.query.q
  queryClient
    .query(contactsQueries.list(typeof q === 'string' ? q : ''))
    .catch(noop)
}

export default function Root(props: RouteSectionProps) {
  const [searchParams, setSearchParams] = useSearchParams<{ q?: string }>()
  const q = () => searchParams.q ?? ''
  const contactsQuery = useQuery(() => contactsQueries.list(q()))
  const fetchingContacts = useIsFetching(() => ({
    queryKey: contactsQueries.lists(),
  }))
  const searching = () => fetchingContacts() > 0
  const isRouting = useIsRouting()

  const debouncedSearch = debounce((value: string) => {
    setSearchParams({ q: value || undefined })
  }, 500)

  return (
    <>
      <div id="sidebar">
        <h1>Solid Router Contacts</h1>
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
              value={q()}
              class={searching() ? 'loading' : ''}
              onInput={(event) => debouncedSearch(event.currentTarget.value)}
            />
            <div id="search-spinner" aria-hidden hidden={!searching()} />
            <div class="sr-only" aria-live="polite" />
          </form>
          <A href="/contacts/new" class="button">
            New
          </A>
        </div>
        <nav>
          <Suspense>
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
                      <A href={`/contacts/${contact.id}`} activeClass="active">
                        <Show
                          when={contact.first || contact.last}
                          fallback={<i>No Name</i>}
                        >
                          {contact.first} {contact.last}
                        </Show>{' '}
                        <Show when={contact.favorite}>
                          <span>★</span>
                        </Show>
                      </A>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Suspense>
        </nav>
      </div>
      <div id="detail" class={isRouting() ? 'loading' : ''}>
        <ErrorBoundary fallback={(error) => <ErrorPage error={error} />}>
          <Suspense>{props.children}</Suspense>
        </ErrorBoundary>
      </div>
    </>
  )
}
