import { LitElement, html } from 'lit'
import {
  QueryClient,
  QueryClientProvider,
  createQueryController,
} from '@tanstack/lit-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

class LitQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }
}

class LitQueryApp extends LitElement {
  private readonly query = createQueryController(this, {
    queryKey: ['test'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return 'Success'
    },
  })

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const query = this.query()

    if (query.isPending) {
      return html`<div>Loading...</div>`
    }

    if (query.isError) {
      return html`<div>An error has occurred!</div>`
    }

    return html`<div>${query.data}</div>`
  }
}

customElements.define('lit-query-provider', LitQueryProvider)
customElements.define('lit-query-app', LitQueryApp)
