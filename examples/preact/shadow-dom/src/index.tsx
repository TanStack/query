import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import './index.css'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import { render } from 'preact'
import { DogList } from './DogList'

const appRoot = document.getElementById('root')
if (!appRoot) throw new Error('Missing #root element')

const queryClient = new QueryClient()
const shadowRoot = appRoot.attachShadow({ mode: 'open' })
render(
  <QueryClientProvider client={queryClient}>
    <div
      style={{
        padding: '30px',
      }}
    >
      <h2>Dog Breeds</h2>
      <DogList />
    </div>
    <PreactQueryDevtools
      initialIsOpen={false}
      buttonPosition="bottom-left"
      shadowDOMTarget={shadowRoot}
    />
  </QueryClientProvider>,
  shadowRoot,
)
