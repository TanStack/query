import { LitElement, html } from 'lit'
import { QueryClient, QueryClientProvider } from '@tanstack/lit-query'
import './styles.css'
import './app-layout'

const queryClient = new QueryClient()

class RickMortyQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class RickMortyApp extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <rick-morty-query-provider>
        <app-layout></app-layout>
      </rick-morty-query-provider>
    `
  }
}

customElements.define('rick-morty-query-provider', RickMortyQueryProvider)
customElements.define('rick-morty-app', RickMortyApp)
