import { LitElement, html } from 'lit'
import { Router } from '@lit-labs/router'
import { QueryClientProvider, noop, onlineManager } from '@tanstack/lit-query'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { worker } from './mocks'
import { persister, queryClient } from './queryClient'
import { moviesQueries } from './services/movies/queries'
import './movie-list-view'
import './movie-detail-view'

class OfflineQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class OfflineApp extends LitElement {
  static properties = {
    isOnline: { state: true },
  }

  private isOnline = onlineManager.isOnline()
  private unsubscribeOnline: () => void = noop

  private readonly router = new Router(this, [
    {
      path: '/',
      render: () => html`<movie-list-view></movie-list-view>`,
    },
    {
      path: '/:movieId',
      enter: async ({ movieId = '' }) => {
        if (
          !queryClient.getQueryData(moviesQueries.detail(movieId).queryKey) &&
          // do not load if we are offline because it returns a promise that is pending until we go online again
          // we just let the movie-detail-view element handle it
          onlineManager.isOnline()
        ) {
          await queryClient.query(moviesQueries.detail(movieId)).catch(noop)
        }
        return true
      },
      render: ({ movieId }) =>
        html`<movie-detail-view .movieId=${movieId}></movie-detail-view>`,
    },
  ])

  override connectedCallback() {
    super.connectedCallback()
    this.unsubscribeOnline = onlineManager.subscribe((isOnline) => {
      this.isOnline = isOnline
    })
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    this.unsubscribeOnline()
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <offline-query-provider>
        <div style="padding: 16px">
          <button
            type="button"
            @click=${() => onlineManager.setOnline(!this.isOnline)}
          >
            ${this.isOnline ? 'Go offline' : 'Go online'}
          </button>
          ${this.router.outlet()}
        </div>
      </offline-query-provider>
    `
  }
}

customElements.define('offline-query-provider', OfflineQueryProvider)

worker.start().then(async () => {
  const [, restorePromise] = persistQueryClient({ queryClient, persister })
  await restorePromise
  // resume mutations after initial restore from localStorage was successful
  queryClient.resumePausedMutations().then(() => {
    queryClient.invalidateQueries()
  })
  customElements.define('offline-app', OfflineApp)
})
