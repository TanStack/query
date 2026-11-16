import { LitElement, html } from 'lit'
import { QueryClient, QueryClientProvider } from '@tanstack/lit-query'
import './styles.css'
import './app-layout'

const queryClient = new QueryClient()

class StarWarsQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class StarWarsApp extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <star-wars-query-provider>
        <app-layout></app-layout>
      </star-wars-query-provider>
    `
  }
}

customElements.define('star-wars-query-provider', StarWarsQueryProvider)
customElements.define('star-wars-app', StarWarsApp)
