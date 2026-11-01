import localforage from 'localforage'
import { matchSorter } from 'match-sorter'
import sortBy from 'sort-by'
import type { Contact } from './types'

const initialData: Array<Contact> = [
  {
    avatar: 'https://avatars.githubusercontent.com/u/5580297?v=4',
    createdAt: 1660978713047,
    favorite: false,
    first: 'Tanner',
    id: 'usupkc1',
    last: 'Linsley',
    notes: 'Created React Query',
    twitter: '@tannerlinsley',
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/1021430',
    createdAt: 1660979124264,
    favorite: false,
    first: 'Dominik',
    id: 'kvvztl7',
    last: 'D',
    notes: 'Maintains React Query',
    twitter: '@tkdodo',
  },
]

const seed = async () => {
  const contacts = await localforage.getItem<Array<Contact>>('contacts')
  if (!contacts) {
    set(initialData)
  }
}

seed()

export const contactsAPI = {
  getContacts: async (query?: string) => {
    await fakeNetwork()
    let contacts = await localforage.getItem<Array<Contact>>('contacts')
    if (!contacts) contacts = []
    if (query) {
      contacts = matchSorter(contacts, query, { keys: ['first', 'last'] })
    }
    return contacts.sort(sortBy('last', 'createdAt'))
  },
  createContact: async (
    data: Pick<Contact, 'first' | 'last' | 'twitter' | 'avatar' | 'notes'>,
  ) => {
    await fakeNetwork()
    const id = Math.random().toString(36).substring(2, 9)
    const contact = { ...data, id, createdAt: Date.now(), favorite: false }
    const contacts = await contactsAPI.getContacts()
    contacts.unshift(contact)
    await set(contacts)
    return contact
  },
  getContact: async (id: string) => {
    await fakeNetwork()
    const contacts = await localforage.getItem<Array<Contact>>('contacts')
    if (!contacts) return null
    const contact = contacts.find((item) => item.id === id)
    return contact ?? null
  },
  updateContact: async (id: string, updates: Partial<Contact>) => {
    await fakeNetwork()
    const contacts = await localforage.getItem<Array<Contact>>('contacts')
    if (!contacts) return false
    const contact = contacts.find((item) => item.id === id)
    if (!contact) throw new Error(`No contact found for ${id}`)
    Object.assign(contact, updates)
    await set(contacts)
    return contact
  },
  deleteContact: async (id: string) => {
    const contacts = await localforage.getItem<Array<Contact>>('contacts')
    if (!contacts) return false
    const index = contacts.findIndex((contact) => contact.id === id)
    if (index > -1) {
      contacts.splice(index, 1)
      await set(contacts)
      return true
    }
    return false
  },
}

function set(contacts: Array<Contact>) {
  return localforage.setItem('contacts', contacts)
}

async function fakeNetwork() {
  return new Promise((res) => {
    setTimeout(res, Math.random() * 800)
  })
}
