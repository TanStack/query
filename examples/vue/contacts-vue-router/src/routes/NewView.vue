<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import ContactForm from '../ContactForm.vue'
import { contactsAPI } from '../services/contacts/api'
import { contactsQueries } from '../services/contacts/queries'

const router = useRouter()
const queryClient = useQueryClient()

const { mutate } = useMutation({
  mutationFn: (formData: FormData) =>
    contactsAPI.createContact(Object.fromEntries(formData) as any),
  onSuccess: (contact) => {
    queryClient.invalidateQueries({ queryKey: contactsQueries.lists() })
    router.push(`/contacts/${contact.id}`)
  },
})
</script>

<template>
  <ContactForm @submit="mutate" />
</template>
