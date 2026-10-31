<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import ContactForm from '../ContactForm.vue'
import ErrorPage from '../ErrorPage.vue'
import { contactsAPI } from '../services/contacts/api'
import { contactsQueries } from '../services/contacts/queries'

const props = defineProps<{ contactId: string }>()

const router = useRouter()
const queryClient = useQueryClient()

const { data: contact, error } = useQuery(() => ({
  ...contactsQueries.detail(props.contactId),
  retryOnMount: false,
}))

const { mutate } = useMutation({
  mutationFn: (formData: FormData) =>
    contactsAPI.updateContact(props.contactId, Object.fromEntries(formData)),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: contactsQueries.all() })
    router.push(`/contacts/${props.contactId}`)
  },
})
</script>

<template>
  <ErrorPage v-if="error" :error="error" />
  <ContactForm v-else-if="contact" :contact="contact" @submit="mutate" />
</template>
