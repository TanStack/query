import { LitElement, html } from 'lit'
import { Router } from '@lit-labs/router'
import { QueryClient, QueryClientProvider } from '@tanstack/lit-query'
import { worker } from './mocks'
import './about-view'
import './example-view'

const queryClient = new QueryClient()

class LoadMoreQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class LoadMoreApp extends LitElement {
  private readonly router = new Router(this, [
    { path: '/', render: () => html`<example-view></example-view>` },
    { path: '/about', render: () => html`<about-view></about-view>` },
  ])

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <load-more-query-provider
        >${this.router.outlet()}</load-more-query-provider
      >
    `
  }
}

customElements.define('load-more-query-provider', LoadMoreQueryProvider)

worker.start({ onUnhandledRequest: 'bypass' }).then(() => {
  customElements.define('load-more-app', LoadMoreApp)
})
