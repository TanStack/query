import { createRouter, createWebHistory } from 'vue-router'
import { noop } from '@tanstack/vue-query'
import { queryClient } from './queryClient'
import { contactsQueries } from './services/contacts/queries'
import RootView from './routes/RootView.vue'
import IndexView from './routes/IndexView.vue'
import ContactView from './routes/ContactView.vue'
import EditView from './routes/EditView.vue'
import NewView from './routes/NewView.vue'

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
