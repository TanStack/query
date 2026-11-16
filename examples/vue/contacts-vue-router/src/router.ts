import { noop } from '@tanstack/vue-query'
import { createRouter, createWebHistory } from 'vue-router'
import { queryClient } from './queryClient'
import ContactView from './routes/ContactView.vue'
import EditView from './routes/EditView.vue'
import IndexView from './routes/IndexView.vue'
import NewView from './routes/NewView.vue'
import RootView from './routes/RootView.vue'
import { contactsQueries } from './services/contacts/queries'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: RootView,
      children: [
        { path: '', component: IndexView },
        { path: 'contacts/new', component: NewView },
        { path: 'contacts/:contactId', component: ContactView, props: true },
        { path: 'contacts/:contactId/edit', component: EditView, props: true },
      ],
    },
  ],
})

router.beforeResolve(async (to) => {
  const q = typeof to.query.q === 'string' ? to.query.q : ''
  const contactId =
    typeof to.params.contactId === 'string' ? to.params.contactId : undefined

  await Promise.all([
    queryClient
      .query({ ...contactsQueries.list(q), staleTime: 'static' })
      .catch(noop),
    contactId &&
      queryClient
        .query({ ...contactsQueries.detail(contactId), staleTime: 'static' })
        .catch(noop),
  ])
})
