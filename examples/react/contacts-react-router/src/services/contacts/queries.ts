import { suspenseQueryOptions } from '@tanstack/react-query'
import { contactsAPI } from './api'

export const contactsQueries = {
  all: () => ['contacts'] as const,
  lists: () => [...contactsQueries.all(), 'list'] as const,
  list: (q?: string) =>
    suspenseQueryOptions({
      queryKey: [...contactsQueries.lists(), { q }] as const,
      queryFn: () => contactsAPI.getContacts(q),
    }),
  detail: (id: string) =>
    suspenseQueryOptions({
      queryKey: [...contactsQueries.all(), 'detail', id] as const,
      queryFn: async () => {
        const contact = await contactsAPI.getContact(id)
        if (!contact) {
          throw new Response('', {
            status: 404,
            statusText: 'Not Found',
          })
        }
        return contact
      },
    }),
}
