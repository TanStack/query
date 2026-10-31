import { queryOptions } from '@tanstack/vue-query'
import { contactsAPI } from './api'

export const contactsQueries = {
  all: () => ['contacts'] as const,
  lists: () => [...contactsQueries.all(), 'list'] as const,
  list: (q?: string) =>
    queryOptions({
      queryKey: [...contactsQueries.lists(), q ?? 'all'] as const,
      queryFn: () => contactsAPI.getContacts(q),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...contactsQueries.all(), 'detail', id] as const,
      queryFn: async () => {
        const contact = await contactsAPI.getContact(id)
        if (!contact) {
          throw new Error('Not Found')
        }
        return contact
      },
    }),
}
