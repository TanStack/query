import { matchSorter } from 'match-sorter'
import sortBy from 'sort-by'
import type { Contact } from '$lib/services/contacts/types'

let contacts: Array<Contact> = [
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

export async function getContacts(query?: string) {
  await fakeNetwork()
  let result = [...contacts]
  if (query) {
    result = matchSorter(result, query, { keys: ['first', 'last'] })
  }
  return result.sort(sortBy('last', 'createdAt'))
}

export async function createContact(
  data: Pick<Contact, 'first' | 'last' | 'twitter' | 'avatar' | 'notes'>,
) {
  await fakeNetwork()
  const id = Math.random().toString(36).substring(2, 9)
  const contact = { ...data, id, createdAt: Date.now(), favorite: false }
  contacts = [contact, ...contacts]
  return contact
}

export async function getContact(id: string) {
  await fakeNetwork()
  return contacts.find((contact) => contact.id === id) ?? null
}

export async function updateContact(id: string, updates: Partial<Contact>) {
  await fakeNetwork()
  const contact = contacts.find((item) => item.id === id)
  if (!contact) throw new Error(`No contact found for ${id}`)
  Object.assign(contact, updates)
  return contact
}

export function deleteContact(id: string) {
  contacts = contacts.filter((contact) => contact.id !== id)
}

async function fakeNetwork() {
  return new Promise((res) => {
    setTimeout(res, Math.random() * 800)
  })
}
