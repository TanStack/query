import { mutationOptions, suspenseQueryOptions } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { contactsAPI } from './api'
import type { Contact } from './types'

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
