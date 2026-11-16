import { LitElement, html } from 'lit'
import {
  QueryClient,
  QueryClientProvider,
  createMutationController,
  createQueryController,
} from '@tanstack/lit-query'
import { worker } from './mocks'
import { todosMutations, todosQueries } from './services/todos/queries'

const queryClient = new QueryClient()

class AutoRefetchingQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class AutoRefetchingExample extends LitElement {
  static properties = {
    intervalMs: { state: true },
    value: { state: true },
  }

  private intervalMs = 1000
  private value = ''

  private readonly todos = createQueryController(this, () => ({
    ...todosQueries.list(),
    // Refetch the data every second
    refetchInterval: this.intervalMs,
  }))

  private readonly addMutation = createMutationController(this, () => ({
    ...todosMutations.create(),
    onSuccess: (_data, _variables, _onMutateResult, { client }) =>
      client.invalidateQueries({ queryKey: todosQueries.all() }),
  }))

  private readonly clearMutation = createMutationController(this, () => ({
    ...todosMutations.deleteAll(),
    onSuccess: (_data, _variables, _onMutateResult, { client }) =>
      client.invalidateQueries({ queryKey: todosQueries.all() }),
  }))

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private submitForm(event: SubmitEvent) {
    event.preventDefault()
    this.addMutation.mutate(this.value, {
      onSuccess: () => {
        this.value = ''
      },
    })
  }

  render() {
    const { status, data, error, isFetching } = this.todos()

    if (status === 'pending') return html`<h1>Loading...</h1>`
    if (status === 'error') return html`<span>Error: ${error.message}</span>`

    return html`
      <div>
        <h1>Auto Refetch with refetchInterval set to ${this.intervalMs}ms</h1>
        <p>
          This example is best experienced on your own machine, where you can
          open multiple tabs to the same localhost server and see your changes
          propagate between the two.
        </p>
        <label>
          Query Interval speed (ms):
          <input
            .value=${String(this.intervalMs)}
            @input=${(event: Event) =>
              (this.intervalMs = Number(
                (event.currentTarget as HTMLInputElement).value,
              ))}
            type="number"
            step="100"
          />
          <span
            style="display: inline-block; margin-left: .5rem; width: 10px; height: 10px; background: ${
              isFetching ? 'green' : 'transparent'
            }; transition: ${
              !isFetching ? 'all .3s ease' : 'none'
            }; border-radius: 100%; transform: scale(2)"
          ></span>
        </label>
        <h2>Todo List</h2>
        <form @submit=${this.submitForm}>
          <input
            placeholder="enter something"
            .value=${this.value}
            @input=${(event: Event) =>
              (this.value = (event.currentTarget as HTMLInputElement).value)}
          />
        </form>
        <ul>
          ${data.map((item) => html`<li>${item}</li>`)}
        </ul>
        <div>
          <button type="button" @click=${() => this.clearMutation.mutate()}>
            Clear All
          </button>
        </div>
      </div>
    `
  }
}

class AutoRefetchingApp extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <auto-refetching-query-provider>
        <auto-refetching-example></auto-refetching-example>
      </auto-refetching-query-provider>
    `
  }
}

customElements.define(
  'auto-refetching-query-provider',
  AutoRefetchingQueryProvider,
)
customElements.define('auto-refetching-example', AutoRefetchingExample)

worker.start({ onUnhandledRequest: 'bypass' }).then(() => {
  customElements.define('auto-refetching-app', AutoRefetchingApp)
})
