/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { DogList } from './DogList'

const appRoot = document.getElementById('root')
if (!appRoot) throw new Error('Missing #root element')

const queryClient = new QueryClient()
const shadowRoot = appRoot.attachShadow({ mode: 'open' })
render(
  () => (
    <QueryClientProvider client={queryClient}>
      <div
        style={{
          padding: '30px',
        }}
      >
        <h2>Dog Breeds</h2>
        <DogList />
      </div>
      <SolidQueryDevtools
        initialIsOpen={false}
        buttonPosition="bottom-left"
        shadowDOMTarget={shadowRoot}
      />
    </QueryClientProvider>
  ),
  shadowRoot,
)
