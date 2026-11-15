import type { Contact } from './types'

export const contactsAPI = (customFetch = fetch) => ({
  getContacts: async (query: string): Promise<Array<Contact>> => {
    const response = await customFetch(
      `/api/contacts?q=${encodeURIComponent(query)}`,
    )
    if (!response.ok) throw new Error('Failed to fetch contacts')
    return await response.json()
  },
  getContact: async (id: string): Promise<Contact> => {
    const response = await customFetch(`/api/contacts/${id}`)
    if (response.status === 404) throw new Error('Not Found')
    if (!response.ok) throw new Error('Failed to fetch contact')
    return await response.json()
  },
})
