import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { DogList } from './DogList'

const appRoot = document.getElementById('root')

if (appRoot) {
  const queryClient = new QueryClient()
  const shadowRoot = appRoot.attachShadow({ mode: 'open' })
  const root = ReactDOM.createRoot(shadowRoot)

  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <div
          style={{
            width: '100vw',
            padding: '30px',
          }}
        >
          <h2>Dog Breeds</h2>
          <DogList />
        </div>
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
          shadowDOMTarget={appRoot.shadowRoot!}
        />
      </QueryClientProvider>
    </React.StrictMode>,
  )
}
