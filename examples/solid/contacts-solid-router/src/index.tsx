/* @refresh reload */
import { render } from 'solid-js/web'
import { Route, Router } from '@solidjs/router'
import { QueryClientProvider } from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'

import './index.css'

import { queryClient } from './queryClient'
import Root, { preload as rootPreload } from './routes/root'
import Contact, { preload as contactPreload } from './routes/contact'
import EditContact from './routes/edit'
import Index from './routes/index'
import NewContact from './routes/new'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(
  () => (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Route path="/" component={Root} preload={rootPreload}>
          <Route path="/" component={Index} />
          <Route path="/contacts/new" component={NewContact} />
          <Route
            path="/contacts/:contactId"
            component={Contact}
            preload={contactPreload}
          />
          <Route
            path="/contacts/:contactId/edit"
            component={EditContact}
            preload={contactPreload}
          />
        </Route>
      </Router>
      <SolidQueryDevtools buttonPosition="bottom-right" />
    </QueryClientProvider>
  ),
  rootElement,
)
