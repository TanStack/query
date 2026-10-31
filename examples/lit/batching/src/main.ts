import { LitElement, html } from 'lit'
import { QueryClient, QueryClientProvider } from '@tanstack/lit-query'
import './character-list'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
    },
  },
})

class BatchingQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class BatchingApp extends LitElement {
  static properties = {
    ids: { state: true },
    idsToLoad: { state: true },
    error: { state: true },
  }

  private ids: Array<number> = []
  private idsToLoad: Array<number> = []
  private error = ''

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private handleInput(event: Event) {
    const parsedIds = (event.currentTarget as HTMLInputElement).value
      .split(',')
      .map((id) => id.trim())

    if (parsedIds.every((id) => /^\d+$/.test(id))) {
      this.ids = parsedIds.map(Number)
      this.error = ''
    } else {
      this.error = 'Invalid.. only use numbers and comma'
    }
  }

  render() {
    return html`
      <batching-query-provider>
        <div class="App">
          <h2>Character fetcher</h2>
          <div>
            <label for="ids" style="display: block">
              Character ids (numeric, comma separated)
            </label>
            <input
              id="ids"
              style="display: inline-block"
              placeholder="ids"
              @input=${this.handleInput}
            />
          </div>

          ${this.error ? html`<h3 style="color: red">${this.error}</h3>` : null}

          <button
            type="button"
            ?disabled=${!!this.error}
            @click=${() => (this.idsToLoad = this.ids)}
          >
            Load characters
          </button>
          <div>
            <h4 style="text-align: left">Characters:</h4>
            <character-list .ids=${this.idsToLoad}></character-list>
          </div>
        </div>
      </batching-query-provider>
    `
  }
}

customElements.define('batching-query-provider', BatchingQueryProvider)
customElements.define('batching-app', BatchingApp)
