import {
  QueryClient,
  QueryClientProvider,
  createQueryController,
  isFetching,
  isPending,
} from '@tanstack/lit-query'
import { LitElement, html } from 'lit'
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
    const queryResult = this.repo()

    if (isPending(queryResult)) return html`Loading...`

    if (queryResult.error)
      return html`An error has occurred: ${queryResult.error.message}`

    return html`
      <h1>${queryResult.data.name}</h1>
      <p>${queryResult.data.description}</p>
      <strong>👀 ${queryResult.data.subscribers_count}</strong>
      <strong>✨ ${queryResult.data.stargazers_count}</strong>
      <strong>🍴 ${queryResult.data.forks_count}</strong>
      <div>${isFetching(queryResult) ? 'Updating...' : ''}</div>
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
