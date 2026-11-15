import { LitElement, html } from 'lit'
import {
  QueryClient,
  QueryClientProvider,
  createQueryController,
} from '@tanstack/lit-query'
import { reposQueries } from './services/repos/queries'

const queryClient = new QueryClient()

class SimpleQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class SimpleExample extends LitElement {
  private readonly repo = createQueryController(this, reposQueries.detail())

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const { data, error, isFetching, isPending } = this.repo()

    if (isPending) return html`Loading...`

    if (error) return html`An error has occurred: ${error.message}`

    return html`
      <h1>${data.name}</h1>
      <p>${data.description}</p>
      <strong>👀 ${data.subscribers_count}</strong>
      <strong>✨ ${data.stargazers_count}</strong>
      <strong>🍴 ${data.forks_count}</strong>
      <div>${isFetching ? 'Updating...' : ''}</div>
    `
  }
}

class SimpleApp extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <simple-query-provider>
        <simple-example></simple-example>
      </simple-query-provider>
    `
  }
}

customElements.define('simple-query-provider', SimpleQueryProvider)
customElements.define('simple-example', SimpleExample)
customElements.define('simple-app', SimpleApp)
