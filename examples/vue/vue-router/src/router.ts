import { createRouter, createWebHistory } from 'vue-router'
import { noop } from '@tanstack/vue-query'
import { queryClient } from './queryClient'
import { contactsQueries } from './services/contacts/queries'
import Root from './routes/Root.vue'
import Index from './routes/Index.vue'
import Contact from './routes/Contact.vue'
import Edit from './routes/Edit.vue'
import New from './routes/New.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Root,
      children: [
        { path: '', component: Index },
        { path: 'contacts/new', component: New },
        { path: 'contacts/:contactId', component: Contact, props: true },
        { path: 'contacts/:contactId/edit', component: Edit, props: true },
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
