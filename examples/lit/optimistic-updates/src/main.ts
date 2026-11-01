import { LitElement, html } from 'lit'
import { QueryClient, QueryClientProvider } from '@tanstack/lit-query'
import { worker } from './mocks'
import './approach-tabs'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
})

class OptimisticUpdatesQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class OptimisticUpdatesApp extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <optimistic-updates-query-provider>
        <main style="max-width: 600px; margin: 0 auto; padding: 2rem 1rem">
          <h1>Optimistic Updates with TanStack Query</h1>
          <p style="color: #666; margin-bottom: 1.5rem">
            Add todos to see optimistic updates in action. The server randomly
            fails ~30% of the time so you can observe automatic rollback.
          </p>
          <approach-tabs></approach-tabs>
        </main>
      </optimistic-updates-query-provider>
    `
  }
}

customElements.define(
  'optimistic-updates-query-provider',
  OptimisticUpdatesQueryProvider,
)

worker.start({ onUnhandledRequest: 'bypass' }).then(() => {
  customElements.define('optimistic-updates-app', OptimisticUpdatesApp)
})
