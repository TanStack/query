import { LitElement, html } from 'lit'
import { Router } from '@lit-labs/router'
import { QueryClient, QueryClientProvider } from '@tanstack/lit-query'
import './character-view'
import './home-view'

const queryClient = new QueryClient()

class PrefetchingQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class PrefetchingApp extends LitElement {
  private readonly router = new Router(this, [
    { path: '/', render: () => html`<home-view></home-view>` },
    {
      path: '/character/:id',
      render: ({ id }) =>
        html`<character-view .characterId=${id}></character-view>`,
    },
  ])

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <prefetching-query-provider
        >${this.router.outlet()}</prefetching-query-provider
      >
    `
  }
}

customElements.define('prefetching-query-provider', PrefetchingQueryProvider)
customElements.define('prefetching-app', PrefetchingApp)
