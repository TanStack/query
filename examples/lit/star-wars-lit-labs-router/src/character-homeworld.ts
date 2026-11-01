import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { planetsQueries } from './services/planets/queries'

class CharacterHomeworld extends LitElement {
  static properties = {
    homeworldId: { attribute: false },
  }

  homeworldId = ''

  private readonly homeworld = createQueryController(this, () =>
    planetsQueries.detail(this.homeworldId),
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const { data, status } = this.homeworld()

    if (status === 'pending') return html`<span>Loading...</span>`
    if (status === 'error') return html`<span>Error :(</span>`

    return html`<span>${data.name}</span>`
  }
}

customElements.define('character-homeworld', CharacterHomeworld)
