import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import './index.css'

import ErrorPage from './error-page'
import Root, { loader as rootLoader } from './routes/root'
import Contact, {
  loader as contactLoader,
  action as contactAction,
} from './routes/contact'
import EditContact, { action as editAction } from './routes/edit'
import { action as destroyAction } from './routes/destroy'
import Index from './routes/index'
import NewContact, { action as newAction } from './routes/new'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10,
    },
  },
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    loader: rootLoader(queryClient),
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: 'contacts/new',
        element: <NewContact />,
        action: newAction(queryClient),
        errorElement: <ErrorPage />,
      },
      {
        path: 'contacts/:contactId',
        element: <Contact />,
        loader: contactLoader(queryClient),
        action: contactAction(queryClient),
        errorElement: <ErrorPage />,
      },
      {
        path: 'contacts/:contactId/edit',
        element: <EditContact />,
        loader: contactLoader(queryClient),
        action: editAction(queryClient),
        errorElement: <ErrorPage />,
      },
      {
        path: 'contacts/:contactId/destroy',
        element: <EditContact />,
        action: destroyAction(queryClient),
        errorElement: <ErrorPage />,
      },
    ],
  },
])

const rootElement = document.getElementById('root')
ReactDOM.createRoot(rootElement!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools buttonPosition="bottom-right" />
    </QueryClientProvider>
  </React.StrictMode>,
)
