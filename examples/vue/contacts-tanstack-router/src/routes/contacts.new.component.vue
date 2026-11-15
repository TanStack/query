<script setup lang="ts">
import { useNavigate, useSearch } from '@tanstack/vue-router'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import ContactForm from '../ContactForm.vue'
import {
  contactsMutations,
  contactsQueries,
} from '../services/contacts/queries'

const navigate = useNavigate()
const q = useSearch({ from: '/contacts/new', select: (search) => search.q })
const queryClient = useQueryClient()

const { mutate } = useMutation({
  ...contactsMutations.create(),
  onSuccess: async (contact) => {
    await queryClient.invalidateQueries({ queryKey: contactsQueries.lists() })
    await navigate({
      to: '/contacts/$contactId',
      params: { contactId: contact.id },
      search: { q: q.value },
    })
  },
})
</script>

<template>
  <ContactForm @submit="mutate" />
</template>
