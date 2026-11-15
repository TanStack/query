import { matchSorter } from 'match-sorter'
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

if (!localStorage.getItem('contacts')) {
  set(initialData)
}

export const contactsAPI = {
  getContacts: async (query?: string) => {
    await fakeNetwork()
    let contacts = get()
    if (query) {
      contacts = matchSorter(contacts, query, { keys: ['first', 'last'] })
    }
    return contacts.sort((a, b) =>
      a.last < b.last ? -1 : a.last > b.last ? 1 : a.createdAt - b.createdAt,
    )
  },
  createContact: async (
    data: Pick<Contact, 'first' | 'last' | 'twitter' | 'avatar' | 'notes'>,
  ) => {
    await fakeNetwork()
    const id = Math.random().toString(36).substring(2, 9)
    const contact = { ...data, id, createdAt: Date.now(), favorite: false }
    const contacts = await contactsAPI.getContacts()
    contacts.unshift(contact)
    set(contacts)
    return contact
  },
  getContact: async (id: string) => {
    await fakeNetwork()
    const contacts = get()
    const contact = contacts.find((item) => item.id === id)
    return contact ?? null
  },
  updateContact: async (id: string, updates: Partial<Contact>) => {
    await fakeNetwork()
    const contacts = get()
    const contact = contacts.find((item) => item.id === id)
    if (!contact) throw new Error(`No contact found for ${id}`)
    Object.assign(contact, updates)
    set(contacts)
    return contact
  },
  deleteContact: async (id: string) => {
    await fakeNetwork()
    const contacts = get()
    const index = contacts.findIndex((contact) => contact.id === id)
    if (index > -1) {
      contacts.splice(index, 1)
      set(contacts)
      return true
    }
    return false
  },
}

function get(): Array<Contact> {
  return JSON.parse(localStorage.getItem('contacts') ?? '[]')
}

function set(contacts: Array<Contact>) {
  localStorage.setItem('contacts', JSON.stringify(contacts))
}

async function fakeNetwork() {
  return new Promise((res) => {
    setTimeout(res, Math.random() * 800)
  })
}
