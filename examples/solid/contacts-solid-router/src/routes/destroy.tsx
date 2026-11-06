import { action, redirect } from '@solidjs/router'
import { queryClient } from '../queryClient'
import { contactsAPI } from '../services/contacts/api'
import { contactsQueries } from '../services/contacts/queries'

export const destroyContact = action(async (contactId: string) => {
  await contactsAPI.deleteContact(contactId)
  queryClient.invalidateQueries({ queryKey: contactsQueries.all() })
  throw redirect('/')
}, 'destroyContact')
