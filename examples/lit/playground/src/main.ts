import { LitElement, html } from 'lit'
import { keyed } from 'lit/directives/keyed.js'
import { styleMap } from 'lit/directives/style-map.js'
import { QueryClient, QueryClientProvider } from '@tanstack/lit-query'
import './styles.css'
import { serverConfig } from './services/todos/api'
import './todo-list'
import './edit-todo'
import './add-todo'
import type { PropertyValues } from 'lit'

const queryClient = new QueryClient()

class PlaygroundQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class PlaygroundApp extends LitElement {
  static properties = {
    staleTime: { state: true },
    gcTime: { state: true },
    localErrorRate: { state: true },
    localFetchTimeMin: { state: true },
    localFetchTimeMax: { state: true },
    editingIndex: { state: true },
    views: { state: true },
  }

  private staleTime = 1000
  private gcTime = 3000
  private localErrorRate = serverConfig.errorRate
  private localFetchTimeMin = serverConfig.queryTimeMin
  private localFetchTimeMax = serverConfig.queryTimeMax
  private editingIndex: number | null = null
  private views = ['', 'fruit', 'grape']

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  protected override willUpdate(changedProperties: PropertyValues) {
    serverConfig.errorRate = this.localErrorRate
    serverConfig.queryTimeMin = this.localFetchTimeMin
    serverConfig.queryTimeMax = this.localFetchTimeMax

    if (changedProperties.has('staleTime') || changedProperties.has('gcTime')) {
      queryClient.setDefaultOptions({
        queries: {
          staleTime: this.staleTime,
          gcTime: this.gcTime,
        },
      })
    }
  }

  private onNumberChange(event: Event, setValue: (value: number) => void) {
    const value = (event.currentTarget as HTMLInputElement).valueAsNumber
    if (!Number.isNaN(value)) {
      setValue(value)
    }
  }

  private setEditingIndex(event: CustomEvent<number | null>) {
    this.editingIndex = event.detail
  }

  render() {
    return html`
      <playground-query-provider>
        <p>
          The "staleTime" and "gcTime" durations have been altered in this
          example to show how query stale-ness and query caching work on a
          granular level
        </p>
        <div>
          Stale Time:
          <input
            type="number"
            min="0"
            step="1000"
            .value=${String(this.staleTime)}
            style=${styleMap({ width: '100px' })}
            @input=${(event: Event) =>
              this.onNumberChange(event, (value) => (this.staleTime = value))}
          />
        </div>
        <div>
          Garbage collection Time:
          <input
            type="number"
            min="0"
            step="1000"
            .value=${String(this.gcTime)}
            style=${styleMap({ width: '100px' })}
            @input=${(event: Event) =>
              this.onNumberChange(event, (value) => (this.gcTime = value))}
          />
        </div>
        <br />
        <div>
          Error Rate:
          <input
            type="number"
            min="0"
            max="1"
            step=".05"
            .value=${String(this.localErrorRate)}
            style=${styleMap({ width: '100px' })}
            @input=${(event: Event) =>
              this.onNumberChange(
                event,
                (value) => (this.localErrorRate = value),
              )}
          />
        </div>
        <div>
          Fetch Time Min:
          <input
            type="number"
            min="1"
            step="500"
            .value=${String(this.localFetchTimeMin)}
            style=${styleMap({ width: '60px' })}
            @input=${(event: Event) =>
              this.onNumberChange(
                event,
                (value) => (this.localFetchTimeMin = value),
              )}
          />
        </div>
        <div>
          Fetch Time Max:
          <input
            type="number"
            min="1"
            step="500"
            .value=${String(this.localFetchTimeMax)}
            style=${styleMap({ width: '60px' })}
            @input=${(event: Event) =>
              this.onNumberChange(
                event,
                (value) => (this.localFetchTimeMax = value),
              )}
          />
        </div>
        <br />
        <div class="App">
          <div>
            <button
              type="button"
              @click=${() => queryClient.invalidateQueries()}
            >
              Force Refetch All
            </button>
          </div>
          <br />
          <hr />
          ${this.views.map(
            (view) => html`
              <div>
                <todo-list
                  .initialFilter=${view}
                  @set-editing-index=${this.setEditingIndex}
                ></todo-list>
                <br />
              </div>
            `,
          )}
          <button
            type="button"
            @click=${() => (this.views = [...this.views, ''])}
          >
            Add Filter List
          </button>
          <hr />
          ${
            this.editingIndex !== null
              ? html`
                  ${keyed(
                    this.editingIndex,
                    html`<edit-todo
                      .editingIndex=${this.editingIndex}
                      @set-editing-index=${this.setEditingIndex}
                    ></edit-todo>`,
                  )}
                  <hr />
                `
              : null
          }
          <add-todo></add-todo>
        </div>
        <br />
      </playground-query-provider>
    `
  }
}

customElements.define('playground-query-provider', PlaygroundQueryProvider)
customElements.define('playground-app', PlaygroundApp)
