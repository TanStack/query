import { createDebouncedValue } from '@tanstack/lit-pacer/debouncer'
import { LitElement, html } from 'lit'
import './search-results'

class SearchBox extends LitElement {
  static properties = {
    query: { state: true },
  }

  private query = ''
  private debouncedQuery = createDebouncedValue(this, () => this.query, {
    wait: 300,
  })[0]

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <div>
        <input
          .value=${this.query}
          placeholder="Search products"
          @input=${(event: Event) =>
            (this.query = (event.currentTarget as HTMLInputElement).value)}
        />
        <search-results .query=${this.debouncedQuery()}></search-results>
      </div>
    `
  }
}

customElements.define('search-box', SearchBox)
