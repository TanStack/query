import { LitElement, html } from 'lit'
import './search-results'

class SearchBox extends LitElement {
  static properties = {
    query: { state: true },
  }

  private query = ''

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <div>
        <!-- It is recommended to debounce this event in prod -->
        <input
          .value=${this.query}
          placeholder="Search products"
          @input=${(event: Event) =>
            (this.query = (event.currentTarget as HTMLInputElement).value)}
        />
        <search-results .query=${this.query}></search-results>
      </div>
    `
  }
}

customElements.define('search-box', SearchBox)
