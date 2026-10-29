<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Link,
  Outlet,
  useMatchRoute,
  useNavigate,
  useRouterState,
  useSearch,
} from '@tanstack/vue-router'
import { useDebounceFn } from '@vueuse/core'
import { useIsFetching, useQuery } from '@tanstack/vue-query'
import { contactsQueries } from '../services/contacts/queries'
import type { Ref } from 'vue'

const navigate = useNavigate()
const matchRoute = useMatchRoute()
const loading: Ref<boolean> = useRouterState({
  select: (state) => state.isLoading,
})

const q = useSearch({ from: '__root__', select: (search) => search.q })
const search = ref(q.value ?? '')
watch(q, (value) => {
  search.value = value ?? ''
})

const { data: contacts } = useQuery(() => contactsQueries.list(q.value))
const fetchingContacts = useIsFetching({ queryKey: contactsQueries.lists() })
const searching = computed(() => fetchingContacts.value > 0)

const debouncedSearch = useDebounceFn((value: string) => {
  navigate({ to: '.', search: { q: value || undefined } })
}, 500)
</script>

<template>
  <div id="sidebar">
    <h1>TanStack Router Contacts</h1>
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
      <Link to="/contacts/new" :search="{ q }" class="button">New</Link>
    </div>
    <nav>
      <ul v-if="contacts?.length">
        <li v-for="contact in contacts" :key="contact.id">
          <Link
            to="/contacts/$contactId"
            :params="{ contactId: contact.id }"
            :search="{ q }"
            :active-props="{ class: 'active' }"
            :class="
              matchRoute({
                to: '/contacts/$contactId',
                params: { contactId: contact.id },
                pending: true,
              }).value
                ? 'pending'
                : ''
            "
          >
            <template v-if="contact.first || contact.last">
              {{ contact.first }} {{ contact.last }}
            </template>
            <i v-else>No Name</i>
            {{ ' ' }}
            <span v-if="contact.favorite">★</span>
          </Link>
        </li>
      </ul>
      <p v-else>
        <i>No contacts</i>
      </p>
    </nav>
  </div>
  <div id="detail" :class="loading ? 'loading' : ''">
    <Outlet />
  </div>
</template>
