<script setup lang="ts">
import { useNavigate, useParams, useSearch } from '@tanstack/vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import ContactForm from '../ContactForm.vue'
import {
  contactsMutations,
  contactsQueries,
} from '../services/contacts/queries'

const navigate = useNavigate()
const contactId = useParams({
  from: '/contacts/$contactId/edit',
  select: (params) => params.contactId,
})
const q = useSearch({
  from: '/contacts/$contactId/edit',
  select: (search) => search.q,
})
const queryClient = useQueryClient()

const { data: contact } = useQuery(() =>
  contactsQueries.detail(contactId.value),
)

const { mutate } = useMutation({
  ...contactsMutations.update(),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: contactsQueries.all() })
    await navigate({
      to: '/contacts/$contactId',
      params: { contactId: contactId.value },
      search: { q: q.value },
    })
  },
})
</script>

<template>
  <ContactForm
    v-if="contact"
    :contact="contact"
    @submit="(updates) => mutate({ id: contactId, updates })"
  />
</template>
