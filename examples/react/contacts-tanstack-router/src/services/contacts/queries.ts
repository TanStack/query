import { notFound } from '@tanstack/react-router'
import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { contactsAPI } from './api'
import type { Contact } from './types'

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
          throw notFound()
        }
        return contact
      },
    }),
}

export const contactsMutations = {
  create: () =>
    mutationOptions({
      mutationFn: (
        data: Pick<Contact, 'first' | 'last' | 'twitter' | 'avatar' | 'notes'>,
      ) => contactsAPI.createContact(data),
    }),
  update: () =>
    mutationOptions({
      mutationFn: ({
        id,
        updates,
      }: {
        id: string
        updates: Partial<Contact>
      }) => contactsAPI.updateContact(id, updates),
    }),
  delete: () =>
    mutationOptions({
      mutationFn: (id: string) => contactsAPI.deleteContact(id),
    }),
}
