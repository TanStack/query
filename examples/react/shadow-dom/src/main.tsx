import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

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
            display: 'flex',
            justifyContent: 'center',
            width: '100vw',
          }}
        >
          I'm just an app rendered in a shadow dom...
        </div>
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
          // styleNonce="aifenoainfo"
          shadowDOMTarget={appRoot.shadowRoot!}
        />
      </QueryClientProvider>
    </React.StrictMode>,
  )
}
