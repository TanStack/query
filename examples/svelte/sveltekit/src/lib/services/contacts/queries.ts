import { queryOptions } from '@tanstack/svelte-query'
import { contactsAPI } from './api'

export const contactsQueries = {
  all: () => ['contacts'] as const,
  lists: () => [...contactsQueries.all(), 'list'] as const,
  list: (query: string, customFetch?: typeof fetch) =>
    queryOptions({
      queryKey: [...contactsQueries.lists(), query] as const,
      queryFn: () => contactsAPI(customFetch).getContacts(query),
    }),
  detail: (id: string, customFetch?: typeof fetch) =>
    queryOptions({
      queryKey: [...contactsQueries.all(), 'detail', id] as const,
      queryFn: () => contactsAPI(customFetch).getContact(id),
    }),
}
