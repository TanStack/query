import { LitElement, html } from 'lit'
import { QueryClient, QueryClientProvider } from '@tanstack/lit-query'
import './styles.css'
import './search-box'

const queryClient = new QueryClient()

class AlgoliaQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class AlgoliaApp extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <algolia-query-provider>
        <div class="App">
          <h1>TanStack Query with Algolia</h1>
          <search-box></search-box>
        </div>
      </algolia-query-provider>
    `
  }
}

customElements.define('algolia-query-provider', AlgoliaQueryProvider)
customElements.define('algolia-app', AlgoliaApp)
