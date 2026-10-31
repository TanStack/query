<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { useIsFetching, useQuery } from '@tanstack/vue-query'
import ErrorPage from '../ErrorPage.vue'
import { contactsQueries } from '../services/contacts/queries'

const route = useRoute()
const router = useRouter()

const isNavigating = ref(false)
const removeBeforeEach = router.beforeEach(() => {
  isNavigating.value = true
})
const removeAfterEach = router.afterEach(() => {
  isNavigating.value = false
})
onUnmounted(() => {
  removeBeforeEach()
  removeAfterEach()
})

const q = computed(() =>
  typeof route.query.q === 'string' ? route.query.q : '',
)
const search = ref(q.value)
watch(q, (value) => {
  search.value = value
})

const { data: contacts, error } = useQuery(() => ({
  ...contactsQueries.list(q.value),
  retryOnMount: false,
}))
const fetchingContacts = useIsFetching({ queryKey: contactsQueries.lists() })
const searching = computed(() => fetchingContacts.value > 0)

const debouncedSearch = useDebounceFn((value: string) => {
  router.push({ query: value ? { q: value } : {} })
}, 500)
</script>

<template>
  <ErrorPage v-if="error" :error="error" />
  <template v-else>
    <div id="sidebar">
      <h1>Vue Router Contacts</h1>
      <div>
        <form id="search-form" role="search" @submit.prevent>
          <input
            id="q"
            v-model="search"
            aria-label="Search contacts"
            placeholder="Search"
            type="search"
            name="q"
            autofocus
            :class="searching ? 'loading' : ''"
            @input="debouncedSearch(search)"
          />
          <div id="search-spinner" aria-hidden="true" :hidden="!searching" />
          <div class="sr-only" aria-live="polite" />
        </form>
        <RouterLink to="/contacts/new" class="button">New</RouterLink>
      </div>
      <nav>
        <ul v-if="contacts?.length">
          <li v-for="contact in contacts" :key="contact.id">
            <RouterLink
              :to="`/contacts/${contact.id}`"
              :class="route.params.contactId === contact.id ? 'active' : ''"
            >
              <template v-if="contact.first || contact.last">
                {{ contact.first }} {{ contact.last }}
              </template>
              <i v-else>No Name</i>
              {{ ' ' }}
              <span v-if="contact.favorite">★</span>
            </RouterLink>
          </li>
        </ul>
        <p v-else>
          <i>No contacts</i>
        </p>
      </nav>
    </div>
    <div id="detail" :class="isNavigating ? 'loading' : ''">
      <RouterView :key="route.path" />
    </div>
  </template>
</template>
