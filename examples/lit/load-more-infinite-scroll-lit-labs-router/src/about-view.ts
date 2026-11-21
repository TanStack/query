import { LitElement, html } from 'lit'

class AboutView extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <a
        href=""
        @click=${(event: MouseEvent) => {
          window.history.back()
          event.preventDefault()
        }}
      >
        Back
      </a>
    `
  }
}

customElements.define('about-view', AboutView)
